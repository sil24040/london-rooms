const TRANSLATIONS = {
  en: {
    // Nav
    browse: 'Browse', saved: 'Saved', dashboard: 'Dashboard', profile: 'Profile',
    signIn: 'Sign in', signUp: 'Sign up', signOut: 'Sign out', hi: 'Hi',
    // Hero
    heroTitle: 'Find a room to rent in London',
    heroSub: 'Rooms listed directly by landlords — no agency fees',
    // Search & Filters
    search: 'Search', areaOrStreet: 'Area or street...',
    anyPrice: 'Any price', anyType: 'Any type',
    billsIncl: 'Bills incl.', availableNow: 'Available now',
    newestFirst: 'Newest first', oldest: 'Oldest first',
    priceAsc: 'Price: low to high', priceDesc: 'Price: high to low',
    clearFilters: 'Clear filters', noRoomsFound: 'No rooms found',
    tryAdjusting: 'Try adjusting your search or filters',
    // Room card
    viewRoom: 'View', viewRoomBtn: 'View room', compare: 'Compare',
    billsInclLabel: 'Bills incl.', billsNotIncl: 'Bills not incl.',
    billsIncluded: 'Bills included', billsNotIncluded: 'Bills not included',
    availNow: 'Available now', comingSoon: 'Coming soon',
    perMonth: '/mo', perMonthFull: '/month',
    // Pagination
    prev: 'Prev', next: 'Next', page: 'Page', of: 'of',
    // Auth
    emailPlaceholder: 'Email', passwordPlaceholder: 'Password',
    namePlaceholder: 'Full name', confirmPassword: 'Confirm password',
    createAccount: 'Create account', alreadyHaveAccount: 'Already have an account?',
    noAccount: 'No account?', forgotPassword: 'Forgot password?',
    signingIn: 'Signing in...', creatingAccount: 'Creating account...',
    landlord: 'Landlord', tenant: 'Tenant', iAm: 'I am a',
    // Dashboard
    welcomeBack: 'Welcome back',
    tenantDashboard: 'Tenant dashboard', landlordDashboard: 'Landlord dashboard',
    myRental: 'My rental', myEnquiries: 'My enquiries',
    myListings: 'My listings', receivedEnquiries: 'Received enquiries',
    myBookings: 'My bookings', bookingRequests: 'Booking requests',
    messagesReceived: 'Messages received',
    myProfile: 'My profile',
    // Empty states
    noRoomsListed: 'No rooms listed yet',
    addFirstRoom: 'Add your first room to start receiving enquiries',
    noRentalSet: 'No rental set yet',
    visitRoom: 'Visit a room you\'re renting and tap "Mark as my room"',
    noEnquiries: 'No enquiries sent yet',
    noEnquiriesReceived: 'No enquiries received yet',
    noSavedRooms: 'No saved rooms yet',
    browseToSave: 'Browse rooms and tap View to find your favourites',
    noOffers: 'No pending offers',
    noReviews: 'No reviews yet',
    // Room detail
    contact: 'Contact', sendEnquiry: 'Send enquiry',
    requestToBook: 'Request to book', writeReview: 'Write a review',
    reviews: 'Reviews', review: 'review', reviewsCount: 'reviews',
    viewingAsLandlord: 'You\'re viewing this as a landlord.',
    // Enquiries
    from: 'From', to: 'To',
    landlordReply: 'Landlord\'s reply:', yourReplyLabel: 'Your reply:',
    reply: 'Reply', sendReply: 'Send reply',
    editBtn: 'Edit', deleteBtn: 'Delete', cancel: 'Cancel', close: 'Close',
    // Offers
    offerRoom: '🏠 Offer room', roomOffers: '🏠 Room offers',
    offerReceived: 'The landlord has offered you this room. Would you like to accept?',
    acceptOffer: '✓ Accept', declineOffer: '✗ Decline',
    // Status
    pending: 'pending', replied: 'replied', approved: 'approved',
    rejected: 'rejected', accepted: 'accepted', declined: 'declined',
    // Payments
    paymentHistory: 'Payment history', payNow: 'Pay now', payEarly: 'Pay early',
    paidLabel: 'Paid', cardEnding: 'card ending',
    rentTracker: 'rent tracker — tap an unpaid month to pay',
    rentDue1st: 'rent due the 1st of each month',
    overdue: 'Overdue', dueNow: 'Due now', upcoming: 'Upcoming', paid: 'Paid',
    rentOverdue: 'rent is overdue', daysPastDue: 'days past the due date (1st).',
    // Profile
    fullName: 'Full name', accountType: 'Account type',
    changePassword: 'Change password (optional)',
    currentPasswordLabel: 'Current password', newPasswordLabel: 'New password',
    saveChanges: 'Save changes', dangerZone: 'Danger zone',
    deleteMyAccount: 'Delete my account',
    // Add room
    addRoom: '+ Add room', listRoom: 'List room', editRoom: 'Edit room',
    // Misc
    processing: 'Processing...', yes: 'Yes', no: 'No',
    demoNotice: 'This is a demo — no real payment is processed.',
    thisIsMyRoom: '✓ This is my room', markAsMyRoom: 'Mark as my room',
    notifications: 'Notifications', markAllRead: 'Mark all read',
    noNotifications: 'No notifications yet',
    // Months
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  },
  pt: {
    // Nav
    browse: 'Explorar', saved: 'Guardados', dashboard: 'Painel', profile: 'Perfil',
    signIn: 'Entrar', signUp: 'Registar', signOut: 'Sair', hi: 'Olá',
    // Hero
    heroTitle: 'Encontre um quarto para alugar em Londres',
    heroSub: 'Quartos listados diretamente pelos proprietários — sem taxas de agência',
    // Search & Filters
    search: 'Pesquisar', areaOrStreet: 'Área ou rua...',
    anyPrice: 'Qualquer preço', anyType: 'Qualquer tipo',
    billsIncl: 'Bills incl.', availableNow: 'Disponível agora',
    newestFirst: 'Mais recentes', oldest: 'Mais antigos',
    priceAsc: 'Preço: menor para maior', priceDesc: 'Preço: maior para menor',
    clearFilters: 'Limpar filtros', noRoomsFound: 'Nenhum quarto encontrado',
    tryAdjusting: 'Tente ajustar a sua pesquisa ou filtros',
    // Room card
    viewRoom: 'Ver', viewRoomBtn: 'Ver quarto', compare: 'Comparar',
    billsInclLabel: 'Contas incl.', billsNotIncl: 'Contas não incl.',
    billsIncluded: 'Contas incluídas', billsNotIncluded: 'Contas não incluídas',
    availNow: 'Disponível agora', comingSoon: 'Em breve',
    perMonth: '/mês', perMonthFull: '/mês',
    // Pagination
    prev: 'Anterior', next: 'Seguinte', page: 'Página', of: 'de',
    // Auth
    emailPlaceholder: 'Email', passwordPlaceholder: 'Palavra-passe',
    namePlaceholder: 'Nome completo', confirmPassword: 'Confirmar palavra-passe',
    createAccount: 'Criar conta', alreadyHaveAccount: 'Já tem conta?',
    noAccount: 'Sem conta?', forgotPassword: 'Esqueceu a palavra-passe?',
    signingIn: 'A entrar...', creatingAccount: 'A criar conta...',
    landlord: 'Proprietário', tenant: 'Inquilino', iAm: 'Sou',
    // Dashboard
    welcomeBack: 'Bem-vindo de volta',
    tenantDashboard: 'Painel do inquilino', landlordDashboard: 'Painel do proprietário',
    myRental: 'O meu aluguer', myEnquiries: 'As minhas consultas',
    myListings: 'Os meus anúncios', receivedEnquiries: 'Consultas recebidas',
    myBookings: 'As minhas reservas', bookingRequests: 'Pedidos de reserva',
    messagesReceived: 'Mensagens recebidas',
    myProfile: 'O meu perfil',
    // Empty states
    noRoomsListed: 'Ainda sem quartos listados',
    addFirstRoom: 'Adicione o seu primeiro quarto para começar a receber consultas',
    noRentalSet: 'Nenhum aluguer definido',
    visitRoom: 'Visite um quarto que está a alugar e toque em "Marcar como o meu quarto"',
    noEnquiries: 'Ainda sem consultas enviadas',
    noEnquiriesReceived: 'Ainda sem consultas recebidas',
    noSavedRooms: 'Sem quartos guardados',
    browseToSave: 'Explore os quartos e toque em Ver para guardar os seus favoritos',
    noOffers: 'Sem ofertas pendentes',
    noReviews: 'Sem avaliações ainda',
    // Room detail
    contact: 'Contactar', sendEnquiry: 'Enviar consulta',
    requestToBook: 'Solicitar reserva', writeReview: 'Escrever avaliação',
    reviews: 'Avaliações', review: 'avaliação', reviewsCount: 'avaliações',
    viewingAsLandlord: 'Está a ver isto como proprietário.',
    // Enquiries
    from: 'De', to: 'Para',
    landlordReply: 'Resposta do proprietário:', yourReplyLabel: 'A sua resposta:',
    reply: 'Responder', sendReply: 'Enviar resposta',
    editBtn: 'Editar', deleteBtn: 'Eliminar', cancel: 'Cancelar', close: 'Fechar',
    // Offers
    offerRoom: '🏠 Oferecer quarto', roomOffers: '🏠 Ofertas de quarto',
    offerReceived: 'O proprietário ofereceu-lhe este quarto. Deseja aceitar?',
    acceptOffer: '✓ Aceitar', declineOffer: '✗ Recusar',
    // Status
    pending: 'pendente', replied: 'respondido', approved: 'aprovado',
    rejected: 'rejeitado', accepted: 'aceite', declined: 'recusado',
    // Payments
    paymentHistory: 'Histórico de pagamentos', payNow: 'Pagar agora', payEarly: 'Pagar antecipadamente',
    paidLabel: 'Pago', cardEnding: 'cartão terminado em',
    rentTracker: 'rastreador de renda — toque num mês por pagar',
    rentDue1st: 'renda devida no dia 1 de cada mês',
    overdue: 'Em atraso', dueNow: 'Vence agora', upcoming: 'Próximo', paid: 'Pago',
    rentOverdue: 'renda em atraso', daysPastDue: 'dias após a data de vencimento (dia 1).',
    // Profile
    fullName: 'Nome completo', accountType: 'Tipo de conta',
    changePassword: 'Alterar palavra-passe (opcional)',
    currentPasswordLabel: 'Palavra-passe atual', newPasswordLabel: 'Nova palavra-passe',
    saveChanges: 'Guardar alterações', dangerZone: 'Zona de perigo',
    deleteMyAccount: 'Eliminar a minha conta',
    // Add room
    addRoom: '+ Adicionar quarto', listRoom: 'Listar quarto', editRoom: 'Editar quarto',
    // Misc
    processing: 'A processar...', yes: 'Sim', no: 'Não',
    demoNotice: 'Esta é uma demonstração — nenhum pagamento real é processado.',
    thisIsMyRoom: '✓ Este é o meu quarto', markAsMyRoom: 'Marcar como o meu quarto',
    notifications: 'Notificações', markAllRead: 'Marcar tudo como lido',
    noNotifications: 'Sem notificações ainda',
    // Months
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
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    const pageId = activePage.id.replace('page-','');
    if (typeof showPage === 'function') {
      showPage(pageId);
    }
  }
  setTimeout(applyTranslations, 200);
}

function safeSet(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function applyTranslations() {
  // Process all data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) el.textContent = val;
  });

  // Nav
  safeSet('nav-browse', t('browse'));
  safeSet('nav-saved', t('saved'));
  safeSet('nav-dashboard', t('dashboard'));
  safeSet('nav-profile', t('profile'));
  safeSet('nav-signin', t('signIn'));
  safeSet('nav-signup', t('signUp'));
  safeSet('nav-signout', t('signOut'));

  // Filter bar
  safeSet('bills-incl-label', t('billsIncl'));
  safeSet('avail-now-label', t('availableNow'));
  safeSet('no-rooms-text', t('noRoomsFound'));
  safeSet('try-adjusting-text', t('tryAdjusting'));
  safeSet('clear-filters-text', t('clearFilters'));

  // Dashboard tabs
  safeSet('tab-listings', t('myListings'));
  safeSet('tab-enquiries', t('receivedEnquiries'));
  safeSet('tab-bookings', t('bookingRequests'));

  // Buttons
  safeSet('h-add-room', t('addRoom'));
  safeSet('login-btn', t('signIn'));
  safeSet('register-btn', t('createAccount'));
  safeSet('profile-btn', t('saveChanges'));
  safeSet('btn-login', t('signIn'));
  safeSet('btn-register', t('signUp'));
}

// Initialise language on page load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === currentLang);
  });
  applyTranslations();
});