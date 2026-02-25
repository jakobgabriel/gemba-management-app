// ============================================================================
// Gemba Management System - Translations (en, de, es)
// ============================================================================

export interface TranslationKeys {
  // Auth / Login
  login: string;
  username: string;
  password: string;
  selectAccessLevel: string;
  level1Teams: string;
  level2Areas: string;
  level3Plant: string;

  // Navigation / Structure
  managementLevels: string;
  issueManagement: string;
  managementTools: string;
  issueEscalations: string;
  issueResolution: string;
  issueDashboard: string;
  safetyCross: string;
  gembaWalk: string;

  // Common actions
  logout: string;
  currentShift: string;
  save: string;
  cancel: string;
  close: string;
  confirm: string;
  delete: string;
  edit: string;
  add: string;

  // Production / Hourly tracking
  hourlyProduction: string;
  selectWorkstation: string;
  chooseWorkstation: string;
  changeWorkstation: string;
  workstation: string;
  machineId: string;
  operator: string;
  partNumber: string;
  shift: string;
  hour: string;
  target: string;
  actual: string;
  variance: string;
  notes: string;
  efficiency: string;
  saveShiftData: string;
  reportIssue: string;

  // Issues
  myOpenIssues: string;
  noOpenIssues: string;
  addNewIssue: string;
  issueTitle: string;
  category: string;
  priority: string;
  time: string;
  subcategory: string;
  area: string;
  description: string;
  contactPerson: string;
  escalate: string;
  resolve: string;
  status: string;

  // Categories
  mechanical: string;
  electrical: string;
  quality: string;
  material: string;
  safety: string;
  other: string;

  // Priority / Status
  low: string;
  medium: string;
  high: string;
  open: string;
  escalated: string;
  resolved: string;

  // Safety
  safetyStatus: string;
  markSafetyStatus: string;
  safe: string;
  nearMiss: string;
  incident: string;
  notReported: string;
  daysWithoutAccident: string;
  plantDaysWithoutAccident: string;

  // Voice
  voice: string;
  voiceInput: string;
  recording: string;
  voiceDictation: string;
  clickToDictate: string;

  // Gemba Walk
  gembaWalkProcess: string;
  initiation: string;
  observation: string;
  documentation: string;
  issues: string;
  report: string;
  targetAreas: string;
  focus: string;
  participants: string;
  observationsFindings: string;
  teamFeedback: string;

  // AI / Analytics
  aiAssistant: string;
  naturalLanguageQuery: string;
  search: string;
  generateReport: string;
  resolutionTimes: string;

  // Handover
  shiftHandover: string;
  previousShift: string;
  currentShiftHandover: string;
  noHandoverNotes: string;
  saveHandoverNotes: string;

  // Dashboard / Admin
  dashboard: string;
  analytics: string;
  configuration: string;
  admin: string;
  users: string;
  overview: string;
}

export type TranslationMap = Record<string, TranslationKeys>;

const translations: TranslationMap = {
  // ==========================================================================
  // ENGLISH
  // ==========================================================================
  en: {
    // Auth / Login
    login: 'Login',
    username: 'Username',
    password: 'Password',
    selectAccessLevel: 'Select Access Level',
    level1Teams: 'Level 1 - Teams',
    level2Areas: 'Level 2 - Areas',
    level3Plant: 'Level 3 - Plant',

    // Navigation / Structure
    managementLevels: 'Management Levels',
    issueManagement: 'Issue Management',
    managementTools: 'Management Tools',
    issueEscalations: 'Issue Escalations',
    issueResolution: 'Issue Resolution',
    issueDashboard: 'Issue Dashboard',
    safetyCross: 'Safety Cross',
    gembaWalk: 'Gemba Walk',

    // Common actions
    logout: 'Logout',
    currentShift: 'Current Shift',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',

    // Production / Hourly tracking
    hourlyProduction: 'Hourly Production',
    selectWorkstation: 'Select Workstation',
    chooseWorkstation: 'Choose Workstation',
    changeWorkstation: 'Change Workstation',
    workstation: 'Workstation',
    machineId: 'Machine ID',
    operator: 'Operator',
    partNumber: 'Part Number',
    shift: 'Shift',
    hour: 'Hour',
    target: 'Target',
    actual: 'Actual',
    variance: 'Variance',
    notes: 'Notes',
    efficiency: 'Efficiency',
    saveShiftData: 'Save Shift Data',
    reportIssue: 'Report Issue',

    // Issues
    myOpenIssues: 'My Open Issues',
    noOpenIssues: 'No open issues',
    addNewIssue: 'Add New Issue',
    issueTitle: 'Issue Title',
    category: 'Category',
    priority: 'Priority',
    time: 'Time',
    subcategory: 'Subcategory',
    area: 'Area',
    description: 'Description',
    contactPerson: 'Contact Person',
    escalate: 'Escalate',
    resolve: 'Resolve',
    status: 'Status',

    // Categories
    mechanical: 'Mechanical',
    electrical: 'Electrical',
    quality: 'Quality',
    material: 'Material',
    safety: 'Safety',
    other: 'Other',

    // Priority / Status
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    open: 'Open',
    escalated: 'Escalated',
    resolved: 'Resolved',

    // Safety
    safetyStatus: 'Safety Status',
    markSafetyStatus: 'Mark Safety Status',
    safe: 'Safe',
    nearMiss: 'Near Miss',
    incident: 'Incident',
    notReported: 'Not Reported',
    daysWithoutAccident: 'Days Without Accident',
    plantDaysWithoutAccident: 'Plant Days Without Accident',

    // Voice
    voice: 'Voice',
    voiceInput: 'Voice Input',
    recording: 'Recording',
    voiceDictation: 'Voice Dictation',
    clickToDictate: 'Click to Dictate',

    // Gemba Walk
    gembaWalkProcess: 'Gemba Walk Process',
    initiation: 'Initiation',
    observation: 'Observation',
    documentation: 'Documentation',
    issues: 'Issues',
    report: 'Report',
    targetAreas: 'Target Areas',
    focus: 'Focus',
    participants: 'Participants',
    observationsFindings: 'Observations & Findings',
    teamFeedback: 'Team Feedback',

    // AI / Analytics
    aiAssistant: 'AI Assistant',
    naturalLanguageQuery: 'Natural Language Query',
    search: 'Search',
    generateReport: 'Generate Report',
    resolutionTimes: 'Resolution Times',

    // Handover
    shiftHandover: 'Shift Handover',
    previousShift: 'Previous Shift',
    currentShiftHandover: 'Current Shift Handover',
    noHandoverNotes: 'No handover notes available',
    saveHandoverNotes: 'Save Handover Notes',

    // Dashboard / Admin
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    configuration: 'Configuration',
    admin: 'Admin',
    users: 'Users',
    overview: 'Overview',
  },

  // ==========================================================================
  // GERMAN
  // ==========================================================================
  de: {
    // Auth / Login
    login: 'Anmelden',
    username: 'Benutzername',
    password: 'Passwort',
    selectAccessLevel: 'Zugriffsebene wählen',
    level1Teams: 'Ebene 1 - Teams',
    level2Areas: 'Ebene 2 - Bereiche',
    level3Plant: 'Ebene 3 - Werk',

    // Navigation / Structure
    managementLevels: 'Management-Ebenen',
    issueManagement: 'Problem-Management',
    managementTools: 'Management-Werkzeuge',
    issueEscalations: 'Problem-Eskalationen',
    issueResolution: 'Problemlösung',
    issueDashboard: 'Problem-Dashboard',
    safetyCross: 'Sicherheitskreuz',
    gembaWalk: 'Gemba-Rundgang',

    // Common actions
    logout: 'Abmelden',
    currentShift: 'Aktuelle Schicht',
    save: 'Speichern',
    cancel: 'Abbrechen',
    close: 'Schließen',
    confirm: 'Bestätigen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',

    // Production / Hourly tracking
    hourlyProduction: 'Stündliche Produktion',
    selectWorkstation: 'Arbeitsplatz auswählen',
    chooseWorkstation: 'Arbeitsplatz wählen',
    changeWorkstation: 'Arbeitsplatz wechseln',
    workstation: 'Arbeitsplatz',
    machineId: 'Maschinen-ID',
    operator: 'Bediener',
    partNumber: 'Teilenummer',
    shift: 'Schicht',
    hour: 'Stunde',
    target: 'Soll',
    actual: 'Ist',
    variance: 'Abweichung',
    notes: 'Notizen',
    efficiency: 'Effizienz',
    saveShiftData: 'Schichtdaten speichern',
    reportIssue: 'Problem melden',

    // Issues
    myOpenIssues: 'Meine offenen Probleme',
    noOpenIssues: 'Keine offenen Probleme',
    addNewIssue: 'Neues Problem anlegen',
    issueTitle: 'Problemtitel',
    category: 'Kategorie',
    priority: 'Priorität',
    time: 'Zeit',
    subcategory: 'Unterkategorie',
    area: 'Bereich',
    description: 'Beschreibung',
    contactPerson: 'Ansprechpartner',
    escalate: 'Eskalieren',
    resolve: 'Lösen',
    status: 'Status',

    // Categories
    mechanical: 'Mechanisch',
    electrical: 'Elektrisch',
    quality: 'Qualität',
    material: 'Material',
    safety: 'Sicherheit',
    other: 'Sonstiges',

    // Priority / Status
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    open: 'Offen',
    escalated: 'Eskaliert',
    resolved: 'Gelöst',

    // Safety
    safetyStatus: 'Sicherheitsstatus',
    markSafetyStatus: 'Sicherheitsstatus markieren',
    safe: 'Sicher',
    nearMiss: 'Beinaheunfall',
    incident: 'Vorfall',
    notReported: 'Nicht gemeldet',
    daysWithoutAccident: 'Tage ohne Unfall',
    plantDaysWithoutAccident: 'Werk - Tage ohne Unfall',

    // Voice
    voice: 'Sprache',
    voiceInput: 'Spracheingabe',
    recording: 'Aufnahme',
    voiceDictation: 'Sprachdiktat',
    clickToDictate: 'Zum Diktieren klicken',

    // Gemba Walk
    gembaWalkProcess: 'Gemba-Rundgang-Prozess',
    initiation: 'Initiierung',
    observation: 'Beobachtung',
    documentation: 'Dokumentation',
    issues: 'Probleme',
    report: 'Bericht',
    targetAreas: 'Zielbereiche',
    focus: 'Fokus',
    participants: 'Teilnehmer',
    observationsFindings: 'Beobachtungen & Erkenntnisse',
    teamFeedback: 'Team-Feedback',

    // AI / Analytics
    aiAssistant: 'KI-Assistent',
    naturalLanguageQuery: 'Natürlichsprachliche Abfrage',
    search: 'Suchen',
    generateReport: 'Bericht erstellen',
    resolutionTimes: 'Lösungszeiten',

    // Handover
    shiftHandover: 'Schichtübergabe',
    previousShift: 'Vorherige Schicht',
    currentShiftHandover: 'Aktuelle Schichtübergabe',
    noHandoverNotes: 'Keine Übergabenotizen vorhanden',
    saveHandoverNotes: 'Übergabenotizen speichern',

    // Dashboard / Admin
    dashboard: 'Dashboard',
    analytics: 'Analysen',
    configuration: 'Konfiguration',
    admin: 'Verwaltung',
    users: 'Benutzer',
    overview: 'Übersicht',
  },

  // ==========================================================================
  // SPANISH
  // ==========================================================================
  es: {
    // Auth / Login
    login: 'Iniciar sesión',
    username: 'Usuario',
    password: 'Contraseña',
    selectAccessLevel: 'Seleccionar nivel de acceso',
    level1Teams: 'Nivel 1 - Equipos',
    level2Areas: 'Nivel 2 - Áreas',
    level3Plant: 'Nivel 3 - Planta',

    // Navigation / Structure
    managementLevels: 'Niveles de gestión',
    issueManagement: 'Gestión de problemas',
    managementTools: 'Herramientas de gestión',
    issueEscalations: 'Escalaciones de problemas',
    issueResolution: 'Resolución de problemas',
    issueDashboard: 'Panel de problemas',
    safetyCross: 'Cruz de seguridad',
    gembaWalk: 'Recorrido Gemba',

    // Common actions
    logout: 'Cerrar sesión',
    currentShift: 'Turno actual',
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    confirm: 'Confirmar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar',

    // Production / Hourly tracking
    hourlyProduction: 'Producción por hora',
    selectWorkstation: 'Seleccionar estación',
    chooseWorkstation: 'Elegir estación de trabajo',
    changeWorkstation: 'Cambiar estación de trabajo',
    workstation: 'Estación de trabajo',
    machineId: 'ID de máquina',
    operator: 'Operador',
    partNumber: 'Número de pieza',
    shift: 'Turno',
    hour: 'Hora',
    target: 'Objetivo',
    actual: 'Real',
    variance: 'Variación',
    notes: 'Notas',
    efficiency: 'Eficiencia',
    saveShiftData: 'Guardar datos del turno',
    reportIssue: 'Reportar problema',

    // Issues
    myOpenIssues: 'Mis problemas abiertos',
    noOpenIssues: 'Sin problemas abiertos',
    addNewIssue: 'Agregar nuevo problema',
    issueTitle: 'Título del problema',
    category: 'Categoría',
    priority: 'Prioridad',
    time: 'Tiempo',
    subcategory: 'Subcategoría',
    area: 'Área',
    description: 'Descripción',
    contactPerson: 'Persona de contacto',
    escalate: 'Escalar',
    resolve: 'Resolver',
    status: 'Estado',

    // Categories
    mechanical: 'Mecánico',
    electrical: 'Eléctrico',
    quality: 'Calidad',
    material: 'Material',
    safety: 'Seguridad',
    other: 'Otro',

    // Priority / Status
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    open: 'Abierto',
    escalated: 'Escalado',
    resolved: 'Resuelto',

    // Safety
    safetyStatus: 'Estado de seguridad',
    markSafetyStatus: 'Marcar estado de seguridad',
    safe: 'Seguro',
    nearMiss: 'Casi accidente',
    incident: 'Incidente',
    notReported: 'No reportado',
    daysWithoutAccident: 'Días sin accidentes',
    plantDaysWithoutAccident: 'Planta - Días sin accidentes',

    // Voice
    voice: 'Voz',
    voiceInput: 'Entrada de voz',
    recording: 'Grabando',
    voiceDictation: 'Dictado por voz',
    clickToDictate: 'Clic para dictar',

    // Gemba Walk
    gembaWalkProcess: 'Proceso de recorrido Gemba',
    initiation: 'Iniciación',
    observation: 'Observación',
    documentation: 'Documentación',
    issues: 'Problemas',
    report: 'Informe',
    targetAreas: 'Áreas objetivo',
    focus: 'Enfoque',
    participants: 'Participantes',
    observationsFindings: 'Observaciones y hallazgos',
    teamFeedback: 'Retroalimentación del equipo',

    // AI / Analytics
    aiAssistant: 'Asistente IA',
    naturalLanguageQuery: 'Consulta en lenguaje natural',
    search: 'Buscar',
    generateReport: 'Generar informe',
    resolutionTimes: 'Tiempos de resolución',

    // Handover
    shiftHandover: 'Entrega de turno',
    previousShift: 'Turno anterior',
    currentShiftHandover: 'Entrega del turno actual',
    noHandoverNotes: 'No hay notas de entrega disponibles',
    saveHandoverNotes: 'Guardar notas de entrega',

    // Dashboard / Admin
    dashboard: 'Panel',
    analytics: 'Análisis',
    configuration: 'Configuración',
    admin: 'Administración',
    users: 'Usuarios',
    overview: 'Resumen',
  },
};

export default translations;
