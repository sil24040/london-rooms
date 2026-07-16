const pool = require('../config/db');
const { notify } = require('../utils/helpers');

async function createOffer(req, res) {
  if (req.user.role !== 'landlord') return res.status(403).json({ error: 'Only landlords can send offers' });
  const { enquiryId } = req.body;

  try {
    const enq = await pool.query('SELECT * FROM enquiries WHERE id=$1 AND landlord_id=$2', [enquiryId, req.user.userId]);
    if (!enq.rows[0]) return res.status(404).json({ error: 'Enquiry not found' });
    const e = enq.rows[0];

    const existing = await pool.query('SELECT id FROM offers WHERE enquiry_id=$1 AND status=$2', [enquiryId, 'pending']);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'An offer is already pending for this enquiry' });

    const result = await pool.query(
      'INSERT INTO offers (enquiry_id, room_id, room_title, landlord_id, landlord_name, tenant_id, tenant_name) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [enquiryId, e.room_id, e.room_title, req.user.userId, req.user.name, e.tenant_id, e.tenant_name]
    );

    // Notify tenant
    await notify(
      e.tenant_id,
      'offer_received',
      `${req.user.name} has offered you the room "${e.room_title}"`,
      'dashboard'
    );

    res.status(201).json(mapOffer(result.rows[0]));
  } catch (e) {
    console.error('POST /api/offers failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function respondOffer(req, res) {
  if (req.user.role !== 'tenant') return res.status(403).json({ error: 'Only tenants can respond to offers' });
  const { status } = req.body;
  if (!['accepted', 'declined'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const result = await pool.query(
      'UPDATE offers SET status=$1 WHERE id=$2 AND tenant_id=$3 AND status=$4 RETURNING *',
      [status, req.params.id, req.user.userId, 'pending']
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Offer not found or already responded' });
    const offer = result.rows[0];

    if (status === 'accepted') {
      await pool.query('UPDATE users SET rental_room_id=$1 WHERE id=$2', [offer.room_id, req.user.userId]);
      await pool.query('UPDATE rooms SET available_now=false WHERE id=$1', [offer.room_id]);
      // Notify landlord - accepted
      await notify(
        offer.landlord_id,
        'offer_accepted',
        `${req.user.name} accepted your room offer for "${offer.room_title}"`,
        'dashboard'
      );
    } else {
      // Notify landlord - declined
      await notify(
        offer.landlord_id,
        'offer_declined',
        `${req.user.name} declined your room offer for "${offer.room_title}"`,
        'dashboard'
      );
    }

    res.json(mapOffer(offer));
  } catch (e) {
    console.error('PUT /api/offers/:id failed:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function myOffers(req, res) {
  try {
    const result = await pool.query('SELECT * FROM offers WHERE tenant_id=$1 ORDER BY created_at DESC', [req.user.userId]);
    res.json(result.rows.map(mapOffer));
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function sentOffers(req, res) {
  try {
    const result = await pool.query('SELECT * FROM offers WHERE landlord_id=$1 ORDER BY created_at DESC', [req.user.userId]);
    res.json(result.rows.map(mapOffer));
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

function mapOffer(o) {
  return {
    _id: o.id, enquiryId: o.enquiry_id, roomId: o.room_id, roomTitle: o.room_title,
    landlordId: o.landlord_id, landlordName: o.landlord_name,
    tenantId: o.tenant_id, tenantName: o.tenant_name,
    status: o.status, createdAt: new Date(o.created_at).getTime()
  };
}

module.exports = { createOffer, respondOffer, myOffers, sentOffers };
