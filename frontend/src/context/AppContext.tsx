"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  id: string;
  username: string;
  role: "FARMER" | "AGRONOMIST";
  token: string;
}

interface AppContextType {
  user: UserProfile | null;
  language: string;
  isInitialized: boolean;
  t: (key: string) => string;
  translateDynamic: (text: string) => Promise<string>;
  login: (token: string) => void;
  logout: () => void;
  setLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Static translations dictionary
const STATIC_TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: {
    "Upload": "अपलोड करें",
    "History": "इतिहास",
    "Analytics": "विश्लेषण",
    "Crop Disease Diagnosis": "🌱 फसल रोग निदान",
    "Upload a photo of your crop and our AI will analyze it for potential diseases, providing severity assessment and treatment recommendations.": 
      "अपनी फसल की एक तस्वीर अपलोड करें और हमारी एआई संभावित बीमारियों के लिए इसका विश्लेषण करेगी, जिससे तीव्रता का आकलन और उपचार की सिफारिशें मिलेंगी।",
    "Secure file handling": "🔒 सुरक्षित फ़ाइल हैंडलिंग",
    "Instant AI analysis": "⚡ त्वरित एआई विश्लेषण",
    "8+ crop types": "🌾 8+ फसल प्रकार",
    "Crop Type": "फसल का प्रकार",
    "Select a crop": "फसल चुनें",
    "Farmer Notes": "किसान की टिप्पणियां",
    "Describe what you see (e.g., yellow spots, wilting)": "बताएं कि आप क्या देख रहे हैं (जैसे पीले धब्बे, मुरझाना)",
    "AI Model": "एआई मॉडल",
    "Upload Image": "तस्वीर अपलोड करें",
    "Analyzing...": "विश्लेषण किया जा रहा है...",
    "Diagnosis Result": "निदान का परिणाम",
    "Confidence": "विश्वास स्तर",
    "Severity": "तीव्रता",
    "Treatment Recommendation": "उपचार की सिफारिश",
    "Pending Review": "समीक्षा लंबित है",
    "Verified": "सत्यापित",
    "Logout": "लॉगआउट",
    "Login": "लॉगिन",
    "Username": "उपयोगकर्ता नाम",
    "Password": "पासवर्ड",
    "Register": "पंजीकरण",
    "Agronomist Portal": "👨‍🌾 कृषि विज्ञानी पोर्टल",
    "Pending Requests": "समीक्षा के लिए लंबित अनुरोध",
    "Submit Review": "समीक्षा जमा करें",
    "Confirm Diagnosis": "निदान की पुष्टि करें",
    "Verified Disease Name": "सत्यापित रोग का नाम",
    "Verified Severity": "सत्यापित तीव्रता",
    "Advisory Notes / Treatment": "सलाहकार नोट्स / उपचार",
    "Please log in to use Krishi Clinic.": "कृषि क्लिनिक का उपयोग करने के लिए कृपया लॉगिन करें।",
    "Login Credentials": "लॉगिन क्रेडेंशियल",
    "Farmer Profile": "किसान प्रोफ़ाइल",
    "Agronomist Profile": "कृषि विज्ञानी प्रोफ़ाइल",
    "Select Role": "भूमिका चुनें",
    "Create Account": "खाता बनाएं",
    "Already have an account? Login": "पहले से ही एक खाता है? लॉगिन करें",
    "Don't have an account? Register": "खाता नहीं है? पंजीकरण करें",
    "Error": "त्रुटि",
    "Success": "सफलता",
    "History List": "इतिहास सूची",
    "No predictions found.": "कोई इतिहास नहीं मिला।",
    "Export CSV": "सीएसवी निर्यात",
    "Back to History": "इतिहास पर वापस जाएं",
    "Analyzed on": "विश्लेषण की तिथि",
    "AI Provider": "एआई प्रदाता",
    "Farmer Observations": "किसान का अवलोकन",
    "Status": "स्थिति",
    "Low": "निम्न",
    "Medium": "मध्यम",
    "High": "उच्च",
  },
  te: {
    "Upload": "అప్‌లోడ్",
    "History": "చరిత్ర",
    "Analytics": "విశ్లేషణలు",
    "Crop Disease Diagnosis": "🌱 పంట తెగులు నిర్ధారణ",
    "Upload a photo of your crop and our AI will analyze it for potential diseases, providing severity assessment and treatment recommendations.":
      "మీ పంట ఫోటోను అప్‌లోడ్ చేయండి. మా AI దానిని సంభావ్య తెగుళ్ల కోసం విశ్లేషించి, తీవ్రత అంచనా మరియు చికిత్స సిఫార్సులను అందిస్తుంది.",
    "Secure file handling": "🔒 సురక్షిత ఫైల్ హ్యాండ్లింగ్",
    "Instant AI analysis": "⚡ తక్షణ AI విశ్లేషణ",
    "8+ crop types": "🌾 8+ పంట రకాలు",
    "Crop Type": "పంట రకం",
    "Select a crop": "పంటను ఎంచుకోండి",
    "Farmer Notes": "రైతు గమనికలు",
    "Describe what you see (e.g., yellow spots, wilting)": "మీరు గమనించిన వివరాలు (ఉదా. పసుపు మచ్చలు, ఆకులు ముడుచుకోవడం)",
    "AI Model": "AI మోడల్",
    "Upload Image": "చిత్రాన్ని అప్‌లోड చేయండి",
    "Analyzing...": "విశ్లేషిస్తోంది...",
    "Diagnosis Result": "నిర్ధారణ ఫలితం",
    "Confidence": "నమ్మకశాతం",
    "Severity": "తీవ్రత",
    "Treatment Recommendation": "చికిత్స సిఫార్సు",
    "Pending Review": "సమీక్ష పెండింగ్‌లో ఉంది",
    "Verified": "ధృవీకరించబడింది",
    "Logout": "లాగ్అవుట్",
    "Login": "లాగిన్",
    "Username": "యూజర్ నేమ్",
    "Password": "పాస్‌వర్డ్",
    "Register": "నమోదు",
    "Agronomist Portal": "👨‍🌾 నిపుణుల పోర్तल",
    "Pending Requests": "సమీక్ష కోసం వేచి ఉన్న అభ్యర్థనలు",
    "Submit Review": "సమీక్షను సమర్పించండి",
    "Confirm Diagnosis": "తెగులును ధృవీకరించండి",
    "Verified Disease Name": "ధృవీకరించబడిన తెగులు పేరు",
    "Verified Severity": "ధృవీకరించబడిన తీవ్రత",
    "Advisory Notes / Treatment": "సలహా గమనికలు / చికిత్స",
    "Please log in to use Krishi Clinic.": "దయచేసి కరిషి క్లినిక్ ఉపయోగించడానికి లాగిన్ చేయండి.",
    "Login Credentials": "లాగిన్ వివరాలు",
    "Farmer Profile": "రైతు ప్రొఫైల్",
    "Agronomist Profile": "వ్యవసాయ నిపుణుల ప్రొఫైల్",
    "Select Role": "పాత్రను ఎంచుకోండి",
    "Create Account": "ఖాతా సృష్టించండి",
    "Already have an account? Login": "ఖాతా ఉందా? లాగిన్ అవ్వండి",
    "Don't have an account? Register": "ఖాతా లేదా? నమోదు చేసుకోండి",
    "Error": "లోపం",
    "Success": "విజయం",
    "History List": "చరిత్ర జాబితా",
    "No predictions found.": "ఎలాంటి ఫలితాలు లేవు.",
    "Export CSV": "CSV ఎగుమతి",
    "Back to History": "చరిత్రకు తిరిగి వెళ్ళండి",
    "Analyzed on": "విశ్లేషించిన తేదీ",
    "AI Provider": "AI ప్రదాత",
    "Farmer Observations": "రైతు గమనింపులు",
    "Status": "స్థితి",
    "Low": "తక్కువ",
    "Medium": "మధ్యస్థం",
    "High": "ఎక్కువ",
  },
  mr: {
    "Upload": "अपलोड करा",
    "History": "इतिहास",
    "Analytics": "विश्लेषण",
    "Crop Disease Diagnosis": "🌱 पिकांचे रोग निदान",
    "Upload a photo of your crop and our AI will analyze it for potential diseases, providing severity assessment and treatment recommendations.":
      "तुमच्या पिकाचा फोटो अपलोड करा. आमचे AI संभाव्य रोगांसाठी याचे विश्लेषण करेल आणि तीव्रता तसेच उपचारांची शिफारस करेल.",
    "Secure file handling": "🔒 सुरक्षित फाईल हाताळणी",
    "Instant AI analysis": "⚡ झटपट AI विश्लेषण",
    "8+ crop types": "🌾 ८+ पिकांचे प्रकार",
    "Crop Type": "पिकाचा प्रकार",
    "Select a crop": "पीक निवडा",
    "Farmer Notes": "शेतकऱ्याची नोंद",
    "Describe what you see (e.g., yellow spots, wilting)": "तुम्हाला काय दिसते ते लिहा (उदा. पिवळे डाग, कोमेजणे)",
    "AI Model": "AI मॉडेल",
    "Upload Image": "प्रतिमा अपलोड करा",
    "Analyzing...": "विश्लेषण करत आहे...",
    "Diagnosis Result": "निदानाचे निकाल",
    "Confidence": "विश्वासार्हता",
    "Severity": "तीव्रता",
    "Treatment Recommendation": "उपचार शिफारस",
    "Pending Review": "पुनरावलोकन प्रलंबित",
    "Verified": "सत्यापित",
    "Logout": "लॉगआउट",
    "Login": "लॉगिन",
    "Username": "वापरकर्तानाव",
    "Password": "पासवर्ड",
    "Register": "नोंदणी",
    "Agronomist Portal": "👨‍🌾 कृषी तज्ज्ञ पोर्टल",
    "Pending Requests": "प्रलंबित विनंत्या",
    "Submit Review": "पुनरावलोकन सादर करा",
    "Confirm Diagnosis": "निदानाची पुष्टी करा",
    "Verified Disease Name": "सत्यापित रोगाचे नाव",
    "Verified Severity": "सत्यापित तीव्रता",
    "Advisory Notes / Treatment": "कृषी सल्ला / उपचार",
    "Please log in to use Krishi Clinic.": "कृपया कृषी क्लिनिक वापरण्यासाठी लॉगिन करा.",
    "Login Credentials": "लॉगिन क्रेडेंशियल",
    "Farmer Profile": "शेतकरी प्रोफाइल",
    "Agronomist Profile": "कृषी तज्ज्ञ प्रोफाइल",
    "Select Role": "भूमिका निवडा",
    "Create Account": "खाते तयार करा",
    "Already have an account? Login": "आधीच खाते आहे? लॉगिन करा",
    "Don't have an account? Register": "खाते नाही? नोंदणी करा",
    "Error": "त्रुटी",
    "Success": "यशस्वी",
    "History List": "इतिहास सूची",
    "No predictions found.": "कोणतीही नोंद आढळली नाही.",
    "Export CSV": "CSV निर्यात",
    "Back to History": "इतिहासाकडे परत जा",
    "Analyzed on": "विश्लेषण तारीख",
    "AI Provider": "AI प्रदाता",
    "Farmer Observations": "शेतकऱ्याचे निरीक्षण",
    "Status": "स्थिती",
    "Low": "कमी",
    "Medium": "मध्यम",
    "High": "जास्त",
  },
  es: {
    "Upload": "Subir",
    "History": "Historial",
    "Analytics": "Analítica",
    "Crop Disease Diagnosis": "🌱 Diagnóstico de Enfermedades",
    "Upload a photo of your crop and our AI will analyze it for potential diseases, providing severity assessment and treatment recommendations.":
      "Suba una foto de su cultivo y nuestra IA la analizará en busca de posibles enfermedades, proporcionando evaluación de severidad y recomendaciones de tratamiento.",
    "Secure file handling": "🔒 Manejo seguro de archivos",
    "Instant AI analysis": "⚡ Análisis de IA instantáneo",
    "8+ crop types": "🌾 8+ tipos de cultivos",
    "Crop Type": "Tipo de cultivo",
    "Select a crop": "Seleccione un cultivo",
    "Farmer Notes": "Notas del agricultor",
    "Describe what you see (e.g., yellow spots, wilting)": "Describa lo que observa (ej. manchas amarillas, marchitamiento)",
    "AI Model": "Modelo IA",
    "Upload Image": "Subir Imagen",
    "Analyzing...": "Analizando...",
    "Diagnosis Result": "Resultado de diagnóstico",
    "Confidence": "Confianza",
    "Severity": "Severidad",
    "Treatment Recommendation": "Recomendación de tratamiento",
    "Pending Review": "Revisión pendiente",
    "Verified": "Verificado",
    "Logout": "Cerrar sesión",
    "Login": "Iniciar sesión",
    "Username": "Usuario",
    "Password": "Contraseña",
    "Register": "Registrarse",
    "Agronomist Portal": "👨‍🌾 Portal de Agrónomos",
    "Pending Requests": "Solicitudes pendientes",
    "Submit Review": "Enviar revisión",
    "Confirm Diagnosis": "Confirmar diagnóstico",
    "Verified Disease Name": "Nombre verificado de la enfermedad",
    "Verified Severity": "Severidad verificada",
    "Advisory Notes / Treatment": "Notas de asesoría / Tratamiento",
    "Please log in to use Krishi Clinic.": "Inicie sesión para utilizar Krishi Clinic.",
    "Login Credentials": "Credenciales de inicio de sesión",
    "Farmer Profile": "Perfil de Agricultor",
    "Agronomist Profile": "Perfil de Agrónomo",
    "Select Role": "Seleccionar rol",
    "Create Account": "Crear cuenta",
    "Already have an account? Login": "¿Ya tiene cuenta? Iniciar sesión",
    "Don't have an account? Register": "¿No tiene cuenta? Registrarse",
    "Error": "Error",
    "Success": "Éxito",
    "History List": "Lista de Historial",
    "No predictions found.": "No se encontraron predicciones.",
    "Export CSV": "Exportar CSV",
    "Back to History": "Volver al Historial",
    "Analyzed on": "Analizado el",
    "AI Provider": "Proveedor de IA",
    "Farmer Observations": "Observaciones del agricultor",
    "Status": "Estado",
    "Low": "Bajo",
    "Medium": "Medio",
    "High": "Alto",
  }
};

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      id: parsed.sub,
      username: parsed.username,
      role: parsed.role,
    };
  } catch (e) {
    return null;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [language, setLanguageState] = useState<string>("en");
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load auth and language from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedLang = localStorage.getItem("lang") || "en";
    
    setLanguageState(storedLang);

    if (storedToken) {
      const decoded = parseJwt(storedToken);
      if (decoded) {
        setUser({
          id: decoded.id,
          username: decoded.username,
          role: decoded.role as "FARMER" | "AGRONOMIST",
          token: storedToken,
        });
      } else {
        localStorage.removeItem("token");
      }
    }
    setIsInitialized(true);
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const decoded = parseJwt(token);
    if (decoded) {
      setUser({
        id: decoded.id,
        username: decoded.username,
        role: decoded.role as "FARMER" | "AGRONOMIST",
        token: token,
      });
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const setLanguage = (lang: string) => {
    localStorage.setItem("lang", lang);
    setLanguageState(lang);
  };

  // Helper for static translations
  const t = (key: string): string => {
    if (language === "en") return key;
    const trans = STATIC_TRANSLATIONS[language];
    if (trans && trans[key]) return trans[key];
    return key;
  };

  // Helper for dynamic translations using backend API
  const translateDynamic = async (text: string): Promise<string> => {
    if (!text || language === "en") return text;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const resp = await fetch(`${apiBase}/api/v1/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          target_language: language,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.translated_text;
      }
    } catch (e) {
      console.error("Dynamic translation error", e);
    }
    return text;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        language,
        isInitialized,
        t,
        translateDynamic,
        login,
        logout,
        setLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
