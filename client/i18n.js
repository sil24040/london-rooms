const TRANSLATIONS = {
  en: {
    // Nav
    browse: 'Browse', saved: 'Saved', dashboard: 'Dashboard', profile: 'Profile',
    signIn: 'Sign in', signUp: 'Sign up', signOut: 'Sign out', hi: 'Hi',
    // Hero
    heroTitle: 'Find a room to rent in London',
    heroSub: 'Rooms listed directly by landlords — no agency fees',
    searchPlaceholder: 'Area or street...',
    search: 'Search',
    // Filters
    anyPrice: 'Any price', upTo600: 'Up to £600', upTo800: 'Up to £800', upTo1000: 'Up to £1000',
    anyType: 'Any type', billsIncl: 'Bills incl.', availableNow: 'Available now',
    clear: 'Clear', list: 'List', map: 'Map',
    newestFirst: 'Newest first', oldestFirst: 'Oldest first',
    priceLow: 'Price: low to high', priceHigh: 'Price: high to low',
    rooms: 'rooms', room: 'room',
    // Cards
    perMonth: '/mo', viewRoom: 'View', compare: 'Compare',
    billsInclLabel: 'Bills incl.', billsNotIncl: 'Bills not incl.',
    availNow: 'Available now', comingSoon: 'Coming soon',
    // Detail
    perMonthFull: '/month', billsIncluded: 'Bills included', billsNotIncluded: 'Bills not included',
    contact: 'Contact', signInToEnquire: 'Sign in to send an enquiry',
    viewingAsLandlord: "You're viewing this as a landlord.",
    sendEnquiry: 'Send enquiry',
    markAsMyRoom: 'Mark as my room', thisIsMyRoom: '✓ This is my room',
    // Empty states
    noRoomsFound: 'No rooms found', tryAdjusting: 'Try adjusting your search or filters',
    clearFilters: 'Clear filters', noSavedRooms: 'No saved rooms yet',
    browseToSave: 'Browse rooms and tap View to find your favourites',
    noEnquiries: 'No enquiries sent yet', noEnquiriesReceived: 'No enquiries received yet',
    noRoomsListed: 'No rooms listed yet', addFirstRoom: 'Add your first room to start receiving enquiries',
    noRentalSet: 'No rental set yet', visitRoom: 'Visit a room you\'re renting and tap "Mark as my room"',
    // Auth
    createAccount: 'Create account', name: 'Full name', email: 'Email', password: 'Password',
    passwordHint: 'At least 8 characters', iAma: 'I am a...', tenant: 'Tenant', landlord: 'Landlord',
    haveAccount: 'Have an account?', noAccount: 'No account?',
    signingIn: 'Signing in...', creating: 'Creating...',
    // Profile
    myProfile: 'My profile', accountType: 'Account type', changePassword: 'Change password (optional)',
    currentPassword: 'Current password', newPassword: 'New password', saveChanges: 'Save changes',
    profileUpdated: '✓ Profile updated', saving: 'Saving...',
    // Dashboard
    welcomeBack: 'Welcome back', tenantDashboard: 'Tenant dashboard', landlordDashboard: 'Landlord dashboard',
    myEnquiries: 'My enquiries', myListings: 'My listings', receivedEnquiries: 'Received enquiries',
    addRoom: '+ Add room', myRental: 'My rental',
    // Rooms modal
    listARoom: 'List a room', editRoom: 'Edit room',
    title: 'Title', description: 'Description', price: 'Price (£/month)', type: 'Type',
    area: 'Area', address: 'Address', billsIncludedCheck: 'Bills included',
    availableNowCheck: 'Available now', photo: 'Photo (optional)',
    removePhoto: 'Remove current photo', listRoom: 'List room', cancel: 'Cancel',
    adding: 'Adding...', saving2: 'Saving...',
    // Enquiry modal
    sendEnquiryTitle: 'Send enquiry', message: 'Message',
    messagePlaceholder: 'Hi, is this room still available?',
    send: 'Send', sending: 'Sending...', close: 'Close',
    enquirySent: '✓ Sent! The landlord will be in touch.',
    // Reply modal
    replyToEnquiry: 'Reply to enquiry', yourReply: 'Your reply',
    sendReply: 'Send reply', landlordReply: 'Landlord reply:', yourReplyLabel: 'Your reply:',
    reply: 'Reply', pending: 'pending', replied: 'replied',
    // Edit enquiry
    editEnquiry: 'Edit enquiry',
    // Compare
    compareRooms: 'Compare rooms', back: '← Back',
    photoCol: 'Photo', titleCol: 'Title', priceCol: 'Price', typeCol: 'Type',
    areaCol: 'Area', addressCol: 'Address', billsCol: 'Bills included',
    availCol: 'Available now', landlordCol: 'Landlord',
    yes: 'Yes', no: 'No', viewRoomBtn: 'View room',
    selected: 'selected', clearCompare: 'Clear',
    // Rental / Payments
    rentTracker: 'rent tracker — tap an unpaid month to pay',
    paymentHistory: 'Payment history', paid: '✓ Paid', unpaid: 'Unpaid',
    paidLabel: 'Paid', cardEnding: 'card ending',
    payRent: 'Pay rent', cardholderName: 'Cardholder name', cardNumber: 'Card number',
    expiry: 'Expiry', cvc: 'CVC', payNow: 'Pay now', processing: 'Processing...',
    demoNotice: 'This is a demo — no real payment is processed.',
    paymentSuccess: '✓ Payment successful! Receipt added to your history.',
    deletePayment: 'Delete', editBtn: 'Edit', deleteBtn: 'Delete',
    // Pagination
    prev: '← Prev', next: 'Next →', page: 'Page', of: 'of',
    // Errors
    fillAllFields: 'Fill in all fields', validEmail: 'Enter a valid email',
    passwordRequired: 'Password is required', nameRequired: 'Name is required',
    atLeast8: 'At least 8 characters', titleRequired: 'Title is required',
    descMin: 'Description must be at least 10 characters', validPrice: 'Enter a valid price',
    areaRequired: 'Area is required', addressRequired: 'Address is required',
    msgMin: 'Message must be at least 5 characters', replyMin: 'Reply is too short',
    cardNameRequired: 'Cardholder name is required', validCard: 'Enter a valid card number (12-19 digits)',
    expiryFormat: 'Format MM/YY', validCvc: '3-4 digits',
    newPwMin: 'New password must be at least 8 characters',
    // Misc
    delete: 'Delete this room? This cannot be undone.',
    deleteEnquiry: 'Delete this enquiry? This cannot be undone.',
    deletePaymentConfirm: 'Remove this payment record?',
    offline: 'You are offline',
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  },
  pt: {
    // Nav
    browse: 'Explorar', saved: 'Guardados', dashboard: 'Painel', profile: 'Perfil',
    signIn: 'Entrar', signUp: 'Registar', signOut: 'Sair', hi: 'Olá',
    // Hero
    heroTitle: 'Encontre um quarto para alugar em Londres',
    heroSub: 'Quartos listados diretamente pelos proprietários — sem taxas de agência',
    searchPlaceholder: 'Área ou rua...',
    search: 'Pesquisar',
    // Filters
    anyPrice: 'Qualquer preço', upTo600: 'Até £600', upTo800: 'Até £800', upTo1000: 'Até £1000',
    anyType: 'Qualquer tipo', billsIncl: 'Contas incl.', availableNow: 'Disponível agora',
    clear: 'Limpar', list: 'Lista', map: 'Mapa',
    newestFirst: 'Mais recentes', oldestFirst: 'Mais antigos',
    priceLow: 'Preço: menor para maior', priceHigh: 'Preço: maior para menor',
    rooms: 'quartos', room: 'quarto',
    // Cards
    perMonth: '/mês', viewRoom: 'Ver', compare: 'Comparar',
    billsInclLabel: 'Contas incl.', billsNotIncl: 'Contas não incl.',
    availNow: 'Disponível agora', comingSoon: 'Em breve',
    // Detail
    perMonthFull: '/mês', billsIncluded: 'Contas incluídas', billsNotIncluded: 'Contas não incluídas',
    contact: 'Contactar', signInToEnquire: 'Inicie sessão para enviar uma mensagem',
    viewingAsLandlord: 'Está a ver como proprietário.',
    sendEnquiry: 'Enviar mensagem',
    markAsMyRoom: 'Marcar como o meu quarto', thisIsMyRoom: '✓ Este é o meu quarto',
    // Empty states
    noRoomsFound: 'Nenhum quarto encontrado', tryAdjusting: 'Tente ajustar a pesquisa ou filtros',
    clearFilters: 'Limpar filtros', noSavedRooms: 'Nenhum quarto guardado',
    browseToSave: 'Explore quartos e toque em Ver para guardar os seus favoritos',
    noEnquiries: 'Nenhuma mensagem enviada ainda', noEnquiriesReceived: 'Nenhuma mensagem recebida ainda',
    noRoomsListed: 'Nenhum quarto listado ainda', addFirstRoom: 'Adicione o seu primeiro quarto para começar a receber mensagens',
    noRentalSet: 'Nenhum aluguer definido', visitRoom: 'Visite um quarto que está a arrendar e toque em "Marcar como o meu quarto"',
    // Auth
    createAccount: 'Criar conta', name: 'Nome completo', email: 'Email', password: 'Palavra-passe',
    passwordHint: 'Pelo menos 8 caracteres', iAma: 'Sou...', tenant: 'Inquilino', landlord: 'Proprietário',
    haveAccount: 'Já tem conta?', noAccount: 'Não tem conta?',
    signingIn: 'A entrar...', creating: 'A criar...',
    // Profile
    myProfile: 'O meu perfil', accountType: 'Tipo de conta', changePassword: 'Alterar palavra-passe (opcional)',
    currentPassword: 'Palavra-passe atual', newPassword: 'Nova palavra-passe', saveChanges: 'Guardar alterações',
    profileUpdated: '✓ Perfil atualizado', saving: 'A guardar...',
    // Dashboard
    welcomeBack: 'Bem-vindo de volta', tenantDashboard: 'Painel do inquilino', landlordDashboard: 'Painel do proprietário',
    myEnquiries: 'As minhas mensagens', myListings: 'Os meus anúncios', receivedEnquiries: 'Mensagens recebidas',
    addRoom: '+ Adicionar quarto', myRental: 'O meu aluguer',
    // Rooms modal
    listARoom: 'Listar um quarto', editRoom: 'Editar quarto',
    title: 'Título', description: 'Descrição', price: 'Preço (£/mês)', type: 'Tipo',
    area: 'Área', address: 'Morada', billsIncludedCheck: 'Contas incluídas',
    availableNowCheck: 'Disponível agora', photo: 'Foto (opcional)',
    removePhoto: 'Remover foto atual', listRoom: 'Listar quarto', cancel: 'Cancelar',
    adding: 'A adicionar...', saving2: 'A guardar...',
    // Enquiry modal
    sendEnquiryTitle: 'Enviar mensagem', message: 'Mensagem',
    messagePlaceholder: 'Olá, o quarto ainda está disponível?',
    send: 'Enviar', sending: 'A enviar...', close: 'Fechar',
    enquirySent: '✓ Enviado! O proprietário entrará em contacto.',
    // Reply modal
    replyToEnquiry: 'Responder à mensagem', yourReply: 'A sua resposta',
    sendReply: 'Enviar resposta', landlordReply: 'Resposta do proprietário:', yourReplyLabel: 'A sua resposta:',
    reply: 'Responder', pending: 'pendente', replied: 'respondido',
    // Edit enquiry
    editEnquiry: 'Editar mensagem',
    // Compare
    compareRooms: 'Comparar quartos', back: '← Voltar',
    photoCol: 'Foto', titleCol: 'Título', priceCol: 'Preço', typeCol: 'Tipo',
    areaCol: 'Área', addressCol: 'Morada', billsCol: 'Contas incluídas',
    availCol: 'Disponível agora', landlordCol: 'Proprietário',
    yes: 'Sim', no: 'Não', viewRoomBtn: 'Ver quarto',
    selected: 'selecionados', clearCompare: 'Limpar',
    // Rental / Payments
    rentTracker: 'rastreador de renda — toque num mês por pagar',
    paymentHistory: 'Histórico de pagamentos', paid: '✓ Pago', unpaid: 'Por pagar',
    paidLabel: 'Pago', cardEnding: 'cartão terminado em',
    payRent: 'Pagar renda', cardholderName: 'Nome no cartão', cardNumber: 'Número do cartão',
    expiry: 'Validade', cvc: 'CVC', payNow: 'Pagar agora', processing: 'A processar...',
    demoNotice: 'Esta é uma demonstração — nenhum pagamento real é processado.',
    paymentSuccess: '✓ Pagamento efetuado! Recibo adicionado ao histórico.',
    deletePayment: 'Eliminar', editBtn: 'Editar', deleteBtn: 'Eliminar',
    // Pagination
    prev: '← Anterior', next: 'Seguinte →', page: 'Página', of: 'de',
    // Errors
    fillAllFields: 'Preencha todos os campos', validEmail: 'Introduza um email válido',
    passwordRequired: 'A palavra-passe é obrigatória', nameRequired: 'O nome é obrigatório',
    atLeast8: 'Pelo menos 8 caracteres', titleRequired: 'O título é obrigatório',
    descMin: 'A descrição deve ter pelo menos 10 caracteres', validPrice: 'Introduza um preço válido',
    areaRequired: 'A área é obrigatória', addressRequired: 'A morada é obrigatória',
    msgMin: 'A mensagem deve ter pelo menos 5 caracteres', replyMin: 'A resposta é muito curta',
    cardNameRequired: 'O nome no cartão é obrigatório', validCard: 'Introduza um número de cartão válido (12-19 dígitos)',
    expiryFormat: 'Formato MM/AA', validCvc: '3-4 dígitos',
    newPwMin: 'A nova palavra-passe deve ter pelo menos 8 caracteres',
    // Misc
    delete: 'Eliminar este quarto? Esta ação não pode ser desfeita.',
    deleteEnquiry: 'Eliminar esta mensagem? Esta ação não pode ser desfeita.',
    deletePaymentConfirm: 'Remover este registo de pagamento?',
    offline: 'Está offline',
    months: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  }
};

let currentLang = localStorage.getItem('lang') || 'en';

function t(key) {
  return TRANSLATIONS[currentLang][key] || TRANSLATIONS['en'][key] || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  document.getElementById('lang-pt').classList.toggle('active', lang === 'pt');
  document.getElementById('lang-en').setAttribute('aria-pressed', String(lang === 'en'));
  document.getElementById('lang-pt').setAttribute('aria-pressed', String(lang === 'pt'));
  applyTranslations();
  // Re-render current page content
  loadRooms();
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    const id = activePage.id.replace('page-', '');
    if (id === 'dashboard') loadDashboard();
    if (id === 'saved') loadSaved();
    if (id === 'profile') loadProfile();
  }
}

function applyTranslations() {
  // Nav
  document.getElementById('nav-browse').textContent = t('browse');
  document.getElementById('nav-saved').textContent = t('saved');
  document.getElementById('nav-dash').textContent = t('dashboard');
  document.getElementById('nav-profile').textContent = t('profile');
  document.getElementById('btn-login').textContent = t('signIn');
  document.getElementById('btn-register').textContent = t('signUp');
  document.getElementById('btn-logout').textContent = t('signOut');
  const navUser = document.getElementById('nav-user');
  if (user) navUser.textContent = t('hi') + ', ' + user.name.split(' ')[0];

  // Hero
  document.querySelector('.hero h1').textContent = t('heroTitle');
  document.querySelector('.hero p').textContent = t('heroSub');
  document.getElementById('search-input').placeholder = t('searchPlaceholder');
  document.querySelector('.search .btn').textContent = t('search');

  // Filters
  const price = document.getElementById('f-price');
  price.options[0].text = t('anyPrice');
  price.options[1].text = t('upTo600');
  price.options[2].text = t('upTo800');
  price.options[3].text = t('upTo1000');

  const type = document.getElementById('f-type');
  type.options[0].text = t('anyType');

  document.querySelector('label[for="f-bills-label"]') && (document.querySelector('label[for="f-bills-label"]').lastChild.textContent = ' ' + t('billsIncl'));

  const sort = document.getElementById('f-sort');
  sort.options[0].text = t('newestFirst');
  sort.options[1].text = t('oldestFirst');
  sort.options[2].text = t('priceLow');
  sort.options[3].text = t('priceHigh');

  document.getElementById('view-list-btn').textContent = '☰ ' + t('list');
  document.getElementById('view-map-btn').textContent = '🗺 ' + t('map');

  // Auth pages
  safeSet('login-btn', t('signIn'));
  safeSet('register-btn', t('createAccount'));
  safeSet('profile-btn', t('saveChanges'));
}

function safeSet(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// Extend both languages with offers/notifications translations
Object.assign(TRANSLATIONS.en, {
  offerRoom: '🏠 Offer room',
  roomOffers: '🏠 Room offers',
  offerReceived: 'The landlord has offered you this room. Would you like to accept?',
  acceptOffer: '✓ Accept',
  declineOffer: '✗ Decline',
  sendOffer: 'Send a room offer to this tenant?',
  offerSent: '✓ Offer sent! The tenant will see it on their dashboard.',
  noOffers: 'No pending offers',
  notifications: 'Notifications',
  markAllRead: 'Mark all read',
  noNotifications: 'No notifications yet',
  offerAccepted: 'accepted',
  offerDeclined: 'declined',
  offerPending: 'pending',
});

Object.assign(TRANSLATIONS.pt, {
  offerRoom: '🏠 Oferecer quarto',
  roomOffers: '🏠 Ofertas de quarto',
  offerReceived: 'O proprietário ofereceu-lhe este quarto. Deseja aceitar?',
  acceptOffer: '✓ Aceitar',
  declineOffer: '✗ Recusar',
  sendOffer: 'Enviar uma oferta de quarto a este inquilino?',
  offerSent: '✓ Oferta enviada! O inquilino verá no seu painel.',
  noOffers: 'Nenhuma oferta pendente',
  notifications: 'Notificações',
  markAllRead: 'Marcar tudo como lido',
  noNotifications: 'Sem notificações ainda',
  offerAccepted: 'aceite',
  offerDeclined: 'recusado',
  offerPending: 'pendente',
});
Object.assign(TRANSLATIONS.en, {
  rentDue1st: 'rent due the 1st of each month',
  noReviews: 'No reviews yet',
  reviews: 'Reviews',
  review: 'review',
  reviewsCount: 'reviews'
});
Object.assign(TRANSLATIONS.pt, {
  rentDue1st: 'renda devida no dia 1 de cada mes',
  noReviews: 'Sem avaliacoes ainda',
  reviews: 'Avaliacoes',
  review: 'avaliacao',
  reviewsCount: 'avaliacoes'
});

// Patch applyTranslations to also update hardcoded HTML strings
const _patchApply = applyTranslations;
applyTranslations = function() {
  _patchApply();
  safeSet('bills-incl-label', t('billsIncl'));
  safeSet('avail-now-label', t('availableNow'));
  safeSet('no-rooms-text', t('noRoomsFound'));
  safeSet('try-adjusting-text', t('tryAdjusting'));
  safeSet('clear-filters-text', t('clearFilters'));
};
