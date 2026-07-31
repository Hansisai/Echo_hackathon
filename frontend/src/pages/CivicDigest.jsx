import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  Globe, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Archive, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function CivicDigest() {
  const [digests, setDigests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, expired
  const [language, setLanguage] = useState('en'); // en, es, fr, hi

  // Web Speech API states
  const [speakingCardId, setSpeakingCardId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const synthRef = useRef(window.speechSynthesis);

  // Localization Dictionary
  const translations = {
    en: {
      portalTitle: "Civic Policy Digest & Transparency Portal",
      portalSubtitle: "Democratizing public policy explanations into non-technical, plain language for every citizen.",
      searchPlaceholder: "Search policy purpose, name, or keywords...",
      filterAll: "All Policies",
      filterActive: "Active Simulator Policies",
      filterExpired: "Archived Historical Policies",
      purposeHeader: "Why This Policy Exists (Purpose)",
      mechanismHeader: "How It Works (Mechanism)",
      advantagesHeader: "Key Citizen Advantages",
      risksHeader: "Potential Trade-offs & Risks",
      narrateBtn: "Listen Narration",
      pauseBtn: "Pause",
      resumeBtn: "Resume",
      stopBtn: "Stop",
      statusActive: "ACTIVE SIMULATION",
      statusExpired: "HISTORICAL ARCHIVE"
    },
    es: {
      portalTitle: "Portal de Transparencia y Resumen de Políticas Ciudadanas",
      portalSubtitle: "Democratizando las explicaciones de políticas públicas en un lenguaje sencillo y no técnico para todos los ciudadanos.",
      searchPlaceholder: "Buscar propósito, nombre o palabras clave...",
      filterAll: "Todas las Políticas",
      filterActive: "Políticas Activas",
      filterExpired: "Políticas Archivadas",
      purposeHeader: "Propósito de la Política",
      mechanismHeader: "Cómo Funciona el Mecanismo",
      advantagesHeader: "Principales Ventajas Ciudadanas",
      risksHeader: "Riesgos y Desventajas Potenciales",
      narrateBtn: "Escuchar Narración",
      pauseBtn: "Pausar",
      resumeBtn: "Reanudar",
      stopBtn: "Detener",
      statusActive: "SIMULACIÓN ACTIVA",
      statusExpired: "ARCHIVO HISTÓRICO"
    },
    fr: {
      portalTitle: "Portail de Transparence et Synthèse Des Politiques Civiques",
      portalSubtitle: "Vulgarisation des explications de politiques publiques dans un langage clair et non technique pour chaque citoyen.",
      searchPlaceholder: "Rechercher un objectif, un nom ou des mots-clés...",
      filterAll: "Toutes les Politiques",
      filterActive: "Politiques Actives",
      filterExpired: "Archives Historiques",
      purposeHeader: "Objectif de la Politique",
      mechanismHeader: "Fonctionnement du Mécanisme",
      advantagesHeader: "Avantages Pour les Citoyens",
      risksHeader: "Compromis et Risques Potentiels",
      narrateBtn: "Écouter la Narration",
      pauseBtn: "Pause",
      resumeBtn: "Reprendre",
      stopBtn: "Arrêter",
      statusActive: "SIMULATION ACTIVE",
      statusExpired: "ARCHIVE HISTORIQUE"
    },
    hi: {
      portalTitle: "नागरिक नीति संक्षेप और पारदर्शिता पोर्टल",
      portalSubtitle: "प्रत्येक नागरिक के लिए सार्वजनिक नीतियों को सरल और गैर-तकनीकी भाषा में समझना।",
      searchPlaceholder: "नीति का उद्देश्य, नाम या कीवर्ड खोजें...",
      filterAll: "सभी नीतियां",
      filterActive: "सक्रिय नीतियां",
      filterExpired: "पुरालेख (आर्काइव) नीतियां",
      purposeHeader: "नीति का उद्देश्य (Purpose)",
      mechanismHeader: "यह कैसे काम करता है (Mechanism)",
      advantagesHeader: "नागरिकों के मुख्य लाभ",
      risksHeader: "संभावित जोखिम और चुनौतियां",
      narrateBtn: "आवाज में सुनें",
      pauseBtn: "रोकें",
      resumeBtn: "पुनः शुरू करें",
      stopBtn: "बंद करें",
      statusActive: "सक्रिय सिम्युलेटर",
      statusExpired: "ऐतिहासिक आर्काइव"
    }
  };

  // Static translation dictionary for default policy contents in ES, FR, HI
  const cardContentTranslations = {
    congestion_pricing: {
      es: {
        title: "Zona de Tarifa de Congestión",
        purpose: "Reducir los atascamientos de tráfico en horas punta y disminuir el humo de escape tóxico en el centro de la ciudad.",
        mechanism: "Cámaras automatizadas escanean las matrículas que entran al centro urbano y cobran un peaje diario a las cuentas de los conductores.",
        advantages: ["Despeja embotellamientos para autobuses y vehículos de emergencia más rápidos", "Genera ingresos municipales constantes para mejorar el transporte público", "Mejora la calidad del aire del centro"],
        risks: ["Crea una carga financiera para los trabajadores de bajos ingresos que viajan desde los suburbios", "Puede reducir temporalmente las visitas comerciales al centro"]
      },
      fr: {
        title: "Péage Urbain Anti-Congestion",
        purpose: "Réduire les embouteillages aux heures de pointe et diminuer la pollution automobile dans le centre-ville.",
        mechanism: "Des caméras scannent les plaques d'immatriculation à l'entrée du centre-ville et débitent un péage quotidien.",
        advantages: ["Dégage le trafic pour des bus et services d'urgence plus rapides", "Génère des recettes municipales pour financer les transports en commun", "Améliore la qualité de l'air du centre-ville"],
        risks: ["Représente une charge financière pour les navetteurs à faibles revenus", "Risque de baisse temporaire de fréquentation des commerces"]
      },
      hi: {
        title: "भीड़भाड़ शुल्क क्षेत्र (Congestion Pricing)",
        purpose: "पीक आवर्स के दौरान ट्रैफिक जाम को कम करना और शहर के केंद्र में जहरीले धुएं को घटाना।",
        mechanism: "स्वचालित कैमरे लाइसेंस प्लेट स्कैन करते हैं और ड्राइवरों के खातों से दैनिक टोल शुल्क लेते हैं।",
        advantages: ["बस और आपातकालीन वाहनों के लिए रास्ता साफ होता है", "सार्वजनिक परिवहन सुधार के लिए राजस्व उत्पन्न होता है", "शहर के केंद्र की वायु गुणवत्ता में सुधार"],
        risks: ["कम आय वाले यात्रियों पर वित्तीय बोझ बढ़ता है", "दुकानों में ग्राहकों की आवक में अस्थायी कमी आ सकती है"]
      }
    },
    metro_fare_subsidy: {
      es: {
        title: "Subsidio y Expansión del Metro",
        purpose: "Hacer que el transporte público sea asequible para todos los ciudadanos y reducir la dependencia del automóvil privado.",
        mechanism: "La ciudad cubre parte del costo de los boletos con ingresos fiscales y financia nuevas líneas de tren.",
        advantages: ["Ahorro directo para los usuarios diarios", "Conecta barrios periféricos con centros de empleo", "Fomenta caminar hasta las estaciones"],
        risks: ["Alto costo recurrente para el presupuesto municipal", "Posible saturación en horas punta"]
      },
      fr: {
        title: "Subvention et Extension du Métro",
        purpose: "Rendre les transports en commun abordables pour tous et réduire la dépendance à la voiture individuelle.",
        mechanism: "La ville prend en charge une partie du prix dei billets et investit dans de nouvelles lignes.",
        advantages: ["Économies directes para los usagers quotidiens", "Désenclave les quartiers périphériques", "Encourage la marche vers les stations"],
        risks: ["Coût récurrent élevé pour le budget municipal", "Engorgement possible aux heures de pointe"]
      },
      hi: {
        title: "मेट्रो किराया सब्सिडी और विस्तार",
        purpose: "सार्वजनिक परिवहन को सभी नागरिकों के लिए किफायती बनाना और निजी कारों पर निर्भरता घटाना।",
        mechanism: "नगर निगम टैक्स राजस्व का उपयोग करके टिकट की लागत कम करता है और नई लाइनों का निर्माण करता है।",
        advantages: ["दैनिक यात्रियों के लिए प्रत्यक्ष वित्तीय बचत", "बाहरी इलाकों को रोजगार केंद्रों से जोड़ता है", "सक्रिय पैदल चलने को बढ़ावा देता है"],
        risks: ["नगर निगम बजट पर उच्च आवर्ती बोझ", "पीक आवर्स के दौरान मेट्रो में अत्यधिक भीड़"]
      }
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchDigests();

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [statusFilter]);

  async function fetchDigests() {
    setLoading(true);
    try {
      const data = await api.getPolicyDigests(statusFilter);
      setDigests(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch policy digests', err);
      setLoading(false);
    }
  }

  // Filter search
  const filteredDigests = digests.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.purpose.toLowerCase().includes(q) ||
      item.mechanism.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Helper to translate card text dynamically
  const getLocalizedCard = (card) => {
    if (language === 'en') return card;
    const localized = cardContentTranslations[card.id]?.[language];
    if (localized) {
      return {
        ...card,
        title: localized.title || card.title,
        purpose: localized.purpose || card.purpose,
        mechanism: localized.mechanism || card.mechanism,
        advantages: localized.advantages || card.advantages,
        risks: localized.risks || card.risks
      };
    }
    return card;
  };

  // Web Speech API Narration Player
  const handlePlayNarration = (card) => {
    if (!synthRef.current) return;
    const locCard = getLocalizedCard(card);

    if (speakingCardId === card.id && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      return;
    }

    synthRef.current.cancel();

    const textToSpeak = `${locCard.title}. ${t.purposeHeader}: ${locCard.purpose}. ${t.mechanismHeader}: ${locCard.mechanism}. ${t.advantagesHeader}: ${locCard.advantages.join(', ')}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    
    if (language === 'es') utterance.lang = 'es-ES';
    else if (language === 'fr') utterance.lang = 'fr-FR';
    else if (language === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-US';

    utterance.onend = () => {
      setSpeakingCardId(null);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setSpeakingCardId(null);
      setIsPaused(false);
    };

    setSpeakingCardId(card.id);
    setIsPaused(false);
    synthRef.current.speak(utterance);
  };

  const handlePauseNarration = () => {
    if (synthRef.current && speakingCardId) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleStopNarration = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setSpeakingCardId(null);
      setIsPaused(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Portal Hero Header */}
      <div 
        className="glass-panel"
        style={{
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(139, 92, 246, 0.1) 100%)',
          borderLeft: '4px solid var(--color-mobility)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <BookOpen size={24} style={{ color: 'var(--color-mobility)' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-bright)', fontFamily: 'var(--font-display)' }}>
              {t.portalTitle}
            </h2>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, maxWidth: '750px' }}>
            {t.portalSubtitle}
          </p>
        </div>

        {/* Language Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
          <Globe size={18} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              background: 'transparent',
              color: 'var(--text-bright)',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="en" style={{ background: 'var(--bg-panel-solid)' }}>English 🇺🇸</option>
            <option value="es" style={{ background: 'var(--bg-panel-solid)' }}>Español 🇪🇸</option>
            <option value="fr" style={{ background: 'var(--bg-panel-solid)' }}>Français 🇫🇷</option>
            <option value="hi" style={{ background: 'var(--bg-panel-solid)' }}>हिन्दी 🇮🇳</option>
          </select>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-bright)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: statusFilter === 'all' ? 'var(--accent)' : 'transparent',
              color: statusFilter === 'all' ? 'white' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t.filterAll}
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: statusFilter === 'active' ? 'var(--color-environment)' : 'transparent',
              color: statusFilter === 'active' ? 'white' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t.filterActive}
          </button>

          <button
            onClick={() => setStatusFilter('expired')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: statusFilter === 'expired' ? '#f59e0b' : 'transparent',
              color: statusFilter === 'expired' ? 'white' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t.filterExpired}
          </button>
        </div>

      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Fetching Civic Transparency Digest Cards...
        </div>
      ) : filteredDigests.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px border-dashed var(--border-light)' }}>
          <Archive size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>No policies match current search or archive filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
          {filteredDigests.map((card) => {
            const locCard = getLocalizedCard(card);
            const isSpeaking = speakingCardId === card.id;
            const isExpired = card.status === 'expired';

            return (
              <div
                key={card.id}
                className="glass-panel"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  borderTop: isExpired ? '3px solid #f59e0b' : '3px solid var(--accent)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                {/* Status & Category Badge Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    {card.category}
                  </span>

                  <span 
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: isExpired ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isExpired ? '#f59e0b' : '#10b981',
                      border: isExpired ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {isExpired ? t.statusExpired : t.statusActive}
                  </span>
                </div>

                {/* Policy Title & Web Speech Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-bright)', lineHeight: 1.3 }}>
                    {locCard.title}
                  </h3>

                  {/* Web Speech Controls */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {isSpeaking && !isPaused ? (
                      <button
                        onClick={handlePauseNarration}
                        title={t.pauseBtn}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', cursor: 'pointer' }}
                      >
                        <Pause size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePlayNarration(card)}
                        title={t.narrateBtn}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--accent)', background: isSpeaking ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.15)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}
                      >
                        <Volume2 size={14} />
                        {isSpeaking ? t.resumeBtn : t.narrateBtn}
                      </button>
                    )}

                    {isSpeaking && (
                      <button
                        onClick={handleStopNarration}
                        title={t.stopBtn}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', cursor: 'pointer' }}
                      >
                        <Square size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Animated Voice Equalizer Bar Indicator */}
                {isSpeaking && !isPaused && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                    <Volume2 size={14} className="pulse-glow" style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>Audio Narration Active...</span>
                    <div style={{ display: 'flex', gap: '2px', marginLeft: 'auto' }}>
                      <span style={{ width: '3px', height: '12px', background: 'var(--accent)', animation: 'flowParticle 0.6s infinite alternate' }}></span>
                      <span style={{ width: '3px', height: '16px', background: 'var(--accent)', animation: 'flowParticle 0.4s infinite alternate' }}></span>
                      <span style={{ width: '3px', height: '10px', background: 'var(--accent)', animation: 'flowParticle 0.8s infinite alternate' }}></span>
                    </div>
                  </div>
                )}

                {/* Purpose Block */}
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, margin: '0 0 4px 0' }}>
                    {t.purposeHeader}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
                    {locCard.purpose}
                  </p>
                </div>

                {/* Mechanism Block */}
                <div>
                  <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-mobility)', fontWeight: 700, margin: '0 0 4px 0' }}>
                    {t.mechanismHeader}
                  </p>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {locCard.mechanism}
                  </p>
                </div>

                {/* Pros (Advantages) List */}
                <div>
                  <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#10b981', fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} />
                    {t.advantagesHeader}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-bright)' }}>
                    {locCard.advantages.map((adv, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{adv}</li>
                    ))}
                  </ul>
                </div>

                {/* Cons (Risks) List */}
                <div>
                  <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f43f5e', fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    {t.risksHeader}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {locCard.risks.map((rsk, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{rsk}</li>
                    ))}
                  </ul>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
