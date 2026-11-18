"use client";

import { Children, cloneElement, isValidElement } from "react";
import { TRANSLATIONS } from "@/app/translations";
import { useLanguage } from "@/app/language-provider";

const PAGE_TRANSLATIONS = {
  "Track chatbot ticket": "चैटबॉट टिकट ट्रैक करें",
  "Enter the ticket number from your chatbot confirmation. Sign in to view tickets linked to your account.": "अपने चैटबॉट पुष्टिकरण में मिला टिकट नंबर दर्ज करें। अपने खाते से जुड़े टिकट देखने के लिए साइन इन करें।",
  "Sign in to continue": "जारी रखने के लिए साइन इन करें",
  "Ticket number": "टिकट नंबर",
  "Checking...": "जांच हो रही है...",
  "Track ticket": "टिकट ट्रैक करें",
  "Could not find this ticket.": "यह टिकट नहीं मिला।",
  "Service": "सेवा",
  "Ward": "वार्ड",
  "Submitted": "जमा किया गया",
  "Keep this ticket number for future reference. Contact the Panchayat office if you need additional help.": "भविष्य के संदर्भ के लिए यह टिकट नंबर संभालकर रखें। अतिरिक्त सहायता के लिए पंचायत कार्यालय से संपर्क करें।",
  "Refreshing...": "रीफ़्रेश हो रहा है...",
  "Refresh status": "स्थिति रीफ़्रेश करें",
  "← Home": "← होम",
  "Frequently Asked Questions / अक्सर पूछे जाने वाले प्रश्न": "अक्सर पूछे जाने वाले प्रश्न",
  "How do I apply for a birth certificate?": "जन्म प्रमाण पत्र के लिए आवेदन कैसे करें?",
  "Go to the Birth Certificates section, fill in the required form, and submit the necessary documents for verification.": "जन्म प्रमाण पत्र अनुभाग में जाएं, आवश्यक फॉर्म भरें और सत्यापन के लिए जरूरी दस्तावेज जमा करें।",
  "How can I track my complaint status?": "मैं अपनी शिकायत की स्थिति कैसे ट्रैक कर सकता हूँ?",
  "Use the Track Query page and enter your Query ID to view the latest progress and updates.": "नवीनतम प्रगति और अपडेट देखने के लिए शिकायत ट्रैक करें पेज पर अपना शिकायत आईडी दर्ज करें।",
  "What documents are needed for a grievance?": "शिकायत के लिए कौन-कौन से दस्तावेज चाहिए?",
  "Your full address, complaint details, related photo if needed, and any supporting documents should be uploaded or submitted.": "अपना पूरा पता, शिकायत का विवरण, आवश्यकता होने पर संबंधित फोटो और सहायक दस्तावेज़ अपलोड या जमा करें।",
  "Can I ask for help through WhatsApp?": "क्या मैं व्हाट्सऐप से सहायता ले सकता हूँ?",
  "Yes, you can use the WhatsApp Help option from the homepage to quickly contact the Panchayat team.": "हाँ, पंचायत टीम से तुरंत संपर्क करने के लिए होमपेज पर व्हाट्सऐप सहायता विकल्प का उपयोग करें।",
  "Forms & services / फॉर्म और सेवाएँ": "फॉर्म और सेवाएँ",
  "Forms and Downloads / फॉर्म और डाउनलोड": "फॉर्म और डाउनलोड",
  "Search forms and services / फॉर्म और सेवाएँ खोजें": "फॉर्म और सेवाएँ खोजें",
  "Search in English or Hindi / अंग्रेज़ी या हिंदी में खोजें": "अंग्रेज़ी या हिंदी में खोजें",
  "Category / श्रेणी": "श्रेणी",
  "All categories / सभी श्रेणियाँ": "सभी श्रेणियाँ",
  "Clear search and filters / खोज और फ़िल्टर हटाएँ": "खोज और फ़िल्टर हटाएँ",
  "Official downloadable forms / आधिकारिक डाउनलोड फॉर्म": "आधिकारिक डाउनलोड फॉर्म",
  "Loading forms… / फॉर्म लोड हो रहे हैं…": "फॉर्म लोड हो रहे हैं…",
  "Retry / पुनः प्रयास करें": "पुनः प्रयास करें",
  "No downloadable forms match your search or category.": "आपकी खोज या श्रेणी से कोई डाउनलोड फॉर्म नहीं मिला।",
  "No verified official PDFs are published yet. Please use the online service links below; do not rely on unofficial forms.": "अभी कोई सत्यापित आधिकारिक PDF प्रकाशित नहीं है। नीचे दिए गए ऑनलाइन सेवा लिंक का उपयोग करें; गैर-आधिकारिक फॉर्म पर भरोसा न करें।",
  "Online applications / ऑनलाइन आवेदन": "ऑनलाइन आवेदन",
  "Print this page / पेज प्रिंट करें": "पेज प्रिंट करें",
  "What to prepare / क्या तैयार रखें": "क्या तैयार रखें",
  "No services match your search. Try another keyword or category.": "आपकी खोज से कोई सेवा नहीं मिली। दूसरा शब्द या श्रेणी चुनें।",
  "Panchayat form": "पंचायत फॉर्म",
  "Download PDF / PDF डाउनलोड करें": "PDF डाउनलोड करें",
  "Birth certificate application": "जन्म प्रमाण पत्र आवेदन",
  "Death certificate application": "मृत्यु प्रमाण पत्र आवेदन",
  "Apply online / ऑनलाइन आवेदन करें": "ऑनलाइन आवेदन करें",
  "Public services / जन सेवाएँ": "जन सेवाएँ",
  "Grievance application": "शिकायत आवेदन",
  "Voter services / मतदाता सेवाएँ": "मतदाता सेवाएँ",
  "Voter record correction": "मतदाता विवरण में सुधार",
  "Panchayat Funds": "पंचायत कोष",
  "Village Map": "ग्राम मानचित्र",
  "Azamgarh Weather": "आजमगढ़ मौसम",
  "Budget Update for This Month": "इस महीने का बजट अपडेट",
  "The monthly budget has been updated and approved by the Gram Panchayat. You can view detailed allocation for all departments, including development, health, and education initiatives.": "मासिक बजट को ग्राम पंचायत द्वारा अपडेट और स्वीकृत किया गया है। आप विकास, स्वास्थ्य और शिक्षा सहित सभी विभागों का विस्तृत आवंटन देख सकते हैं।",
  "Special Gram Sabha on Sep 25": "25 सितंबर को विशेष ग्राम सभा",
  "Details about the special Gram Sabha event go here…": "विशेष ग्राम सभा कार्यक्रम का विवरण यहाँ देखें…",
  "Book appointments for Gram Panchayat services.": "ग्राम पंचायत सेवाओं के लिए अपॉइंटमेंट बुक करें।",
  "After you submit, the Panchayat office will review your request, add remarks, and set the appointment date and time. You can make one booking every 24 hours.": "जमा करने के बाद पंचायत कार्यालय आपके अनुरोध की समीक्षा करेगा, टिप्पणी जोड़ेगा और अपॉइंटमेंट की तारीख व समय तय करेगा। आप हर 24 घंटे में एक बुकिंग कर सकते हैं।",
  "Booking…": "बुक हो रहा है…",
  "My Appointments": "मेरे अपॉइंटमेंट",
  "Updated": "अपडेट किया गया",
  "Admin update:": "व्यवस्थापक अपडेट:",
  "No appointments booked yet.": "अभी तक कोई अपॉइंटमेंट बुक नहीं हुआ है।",
  "Appointment requested. Reference:": "अपॉइंटमेंट का अनुरोध किया गया। संदर्भ:",
  "The Panchayat office will set your date and time.": "पंचायत कार्यालय आपकी तारीख और समय तय करेगा।",
  "Unable to book appointment.": "अपॉइंटमेंट बुक नहीं हो सका।",
  "Home": "होम",
  "Dashboard": "डैशबोर्ड",
  "My Applications": "मेरे आवेदन",
  "My Notifications": "मेरी सूचनाएं",
  "My Profile": "मेरी प्रोफ़ाइल",
  "Full Name": "पूरा नाम",
  "Mobile Number": "मोबाइल नंबर",
  "Email": "ईमेल",
  "Village": "गाँव",
  "Ward Number": "वार्ड नंबर",
  "Address": "पता",
  "No applications found.": "कोई आवेदन नहीं मिला।",
  "No notifications found.": "कोई सूचना नहीं मिली।",
  "Save Changes": "बदलाव सहेजें",
  "Edit Profile": "प्रोफ़ाइल संपादित करें",
  "Application Details": "आवेदन का विवरण",
  "Request Details": "अनुरोध का विवरण",
  "Track Query": "शिकायत ट्रैक करें",
  "Track": "ट्रैक करें",
  "Loading...": "लोड हो रहा है...",
  "Loading Appointments...": "अपॉइंटमेंट लोड हो रहे हैं...",
  "FAQ": "सामान्य प्रश्न",
  "Open": "खुला",
  "In Progress": "प्रगति में",
  "Resolved": "हल किया गया",
  "Closed": "बंद",
  "Sign In": "साइन इन",
  "Sign in": "साइन इन",
  "Log In": "लॉग इन",
  "Submit": "जमा करें",
  "Cancel": "रद्द करें",
  "Search": "खोजें",
  "Search...": "खोजें...",
  "No results found.": "कोई परिणाम नहीं मिला।",
  "View Details": "विवरण देखें",
  "Hide Details": "विवरण छिपाएं",
  "Date": "तारीख",
  "Status": "स्थिति",
  "Name": "नाम",
  "Phone": "फ़ोन",
  "Purpose": "उद्देश्य",
  "Filter": "फ़िल्टर",
  "Clear": "साफ़ करें",
  "Previous": "पिछला",
  "Next": "अगला",
  "Page": "पृष्ठ",
  "Citizen Dashboard": "नागरिक डैशबोर्ड",
  "Welcome, ": "स्वागत है, ",
  "Access your Panchayat services and personal information in one place.": "अपनी पंचायत सेवाओं और व्यक्तिगत जानकारी को एक ही जगह पर देखें।",
  "Raise New Query": "नई शिकायत दर्ज करें",
  "My Updates": "मेरे अपडेट",
  "My Documents": "मेरे दस्तावेज़",
  "My requests by service": "सेवा के अनुसार मेरे अनुरोध",
  "All requests": "सभी अनुरोध",
  "Aadhaar Update": "आधार अपडेट",
  "Birth Certificate": "जन्म प्रमाण पत्र",
  "Death Certificate": "मृत्यु प्रमाण पत्र",
  "Voter Service": "मतदाता सेवा",
  "Other Service": "अन्य सेवा",
  "My Queries": "मेरी शिकायतें",
  "My Appointments": "मेरे अपॉइंटमेंट",
  "request": "अनुरोध",
  "requests": "अनुरोध",
  "Request timeline & receipts": "अनुरोध समयरेखा और रसीदें",
  "All your submitted service applications, queries, and appointments.": "आपके सभी जमा किए गए सेवा आवेदन, शिकायतें और अपॉइंटमेंट।",
  "Your ": "आपके ",
  " requests.": " अनुरोध।",
  "View all applications": "सभी आवेदन देखें",
  "Search requests": "अनुरोध खोजें",
  "Reference, service, subject": "संदर्भ, सेवा, विषय",
  "All statuses": "सभी स्थितियाँ",
  "From date": "शुरुआत की तारीख",
  "To date": "अंतिम तारीख",
  "No recent requests": "हाल के कोई अनुरोध नहीं",
  "No ": "कोई ",
  "Requests you submit will appear here with their reference number and current status.": "आपके जमा किए गए अनुरोध यहाँ संदर्भ संख्या और वर्तमान स्थिति के साथ दिखाई देंगे।",
  "Start a request": "अनुरोध शुरू करें",
  "My Service Applications Dashboard": "मेरे सेवा आवेदन डैशबोर्ड",
  "Loading dashboard...": "डैशबोर्ड लोड हो रहा है...",
  "Community Notice": "सामुदायिक सूचना",
  "Queries": "शिकायतें",
  "Applications": "आवेदन",
  "Appointments": "अपॉइंटमेंट",
  "Notice board": "सूचना-पट्ट",
  "Unread": "अपठित",
  "Mark all as read": "सभी को पढ़ा हुआ चिह्नित करें",
  "Loading updates...": "अपडेट लोड हो रहे हैं...",
  "No updates yet.": "अभी कोई अपडेट नहीं है।",
  "No updates match this filter.": "इस फ़िल्टर से कोई अपडेट नहीं मिला।",
  "New": "नया",
  "Could not be sent": "भेजा नहीं जा सका",
  "Sending": "भेजा जा रहा है",
  "Not sent (preference or administrator setting)": "नहीं भेजा गया (प्राथमिकता या व्यवस्थापक सेटिंग)",
  "Mark as read": "पढ़ा हुआ चिह्नित करें",
  "Your Citizen ID: ": "आपकी नागरिक आईडी: ",
  "Profile": "प्रोफ़ाइल",
  "No profile photo uploaded": "कोई प्रोफ़ाइल फोटो अपलोड नहीं है",
  "Profile picture": "प्रोफ़ाइल तस्वीर",
  "JPEG, PNG, WebP, or GIF; up to 3 MB.": "JPEG, PNG, WebP या GIF; अधिकतम 3 MB।",
  "Uploading photo...": "फोटो अपलोड हो रही है...",
  "Email verification code": "ईमेल सत्यापन कोड",
  "The code expires in 10 minutes. Your email and mobile number update after verification.": "कोड 10 मिनट में समाप्त हो जाएगा। सत्यापन के बाद आपका ईमेल और मोबाइल नंबर अपडेट होगा।",
  "Verifying...": "सत्यापन हो रहा है...",
  "Verify and Update Contact": "सत्यापित करें और संपर्क अपडेट करें",
  "Account created: ": "खाता बनाया गया: ",
  "Saving...": "सहेजा जा रहा है...",
  "Save Profile": "प्रोफ़ाइल सहेजें",
  "Sending...": "भेजा जा रहा है...",
  "Send New Code": "नया कोड भेजें",
  "Loading profile...": "प्रोफ़ाइल लोड हो रही है...",
  "My Service Applications Dashboard": "मेरे सेवा आवेदन डैशबोर्ड",
  "Application Details": "आवेदन का विवरण",
  "Request details": "अनुरोध का विवरण",
  "Status history": "स्थिति इतिहास",
  "Documents": "दस्तावेज़",
  "Submitted documents": "जमा किए गए दस्तावेज़",
  "Panchayat documents": "पंचायत के दस्तावेज़",
  "Attachments": "संलग्नक",
  "Resolution": "निस्तारण",
  "Resolution document": "निस्तारण दस्तावेज़",
  "Request not found.": "अनुरोध नहीं मिला।",
  "Loading request details...": "अनुरोध का विवरण लोड हो रहा है...",
  "Back to dashboard": "डैशबोर्ड पर वापस जाएँ",
  "← Citizen dashboard": "← नागरिक डैशबोर्ड",
  " request": " अनुरोध",
  "Latest Panchayat response:": "पंचायत का नवीनतम जवाब:",
  "Documents requested:": "अनुरोधित दस्तावेज़:",
  "Appointment:": "अपॉइंटमेंट:",
  "Submitted form information": "जमा किए गए फॉर्म की जानकारी",
  "Document ": "दस्तावेज़ ",
  "My Profile": "मेरी प्रोफ़ाइल",
  "Unable to load profile. Please refresh the page.": "प्रोफ़ाइल लोड नहीं हो सकी। कृपया पेज रीफ़्रेश करें।",
  "Unable to load updates.": "अपडेट लोड नहीं हो सके।",
  "Unable to load this request.": "यह अनुरोध लोड नहीं हो सका।",
  "My Service Applications Dashboard": "मेरे सेवा आवेदन डैशबोर्ड",
};

function createDictionary(language) {
  const dictionary = language === "hi" ? { ...PAGE_TRANSLATIONS } : {};

  function collectTranslations(value) {
    if (!value || typeof value !== "object") return;
    if (typeof value.en === "string" && typeof value.hi === "string") {
      dictionary[language === "hi" ? value.en : value.hi] =
        language === "hi" ? value.hi : value.en;
    }
    Object.values(value).forEach(collectTranslations);
  }

  if (language === "en") {
    for (const [english, hindi] of Object.entries(PAGE_TRANSLATIONS)) {
      const englishText = english.split(" / ")[0];
      dictionary[hindi] = englishText;
      if (english.includes(" / ")) dictionary[english] = englishText;
    }
  }
  collectTranslations(TRANSLATIONS);
  return dictionary;
}

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function translateText(value, dictionary) {
  const normalized = normalizeText(value);
  const translation = dictionary[normalized];
  if (!translation) return value;
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  return `${leading}${translation}${trailing}`;
}

function translateChildren(children, dictionary) {
  return Children.map(children, (child) => {
    if (typeof child === "string") return translateText(child, dictionary);
    if (typeof child === "number" || !isValidElement(child)) return child;
    const props = {};
    for (const name of ["aria-label", "alt", "placeholder", "title"]) {
      if (typeof child.props[name] === "string") {
        props[name] = translateText(child.props[name], dictionary);
      }
    }
    if (child.props.children !== undefined) {
      props.children = translateChildren(child.props.children, dictionary);
    }
    return cloneElement(child, props);
  });
}

export function LocalizedPage({ children }) {
  const { language } = useLanguage();
  const dictionary = createDictionary(language);
  return <>{translateChildren(children, dictionary)}</>;
}

export function withLocalizedPage(Page) {
  function LanguageAwarePage(props) {
    return (
      <LocalizedPage>
        {Page(props)}
      </LocalizedPage>
    );
  }

  LanguageAwarePage.displayName = `withLocalizedPage(${Page.displayName || Page.name || "Page"})`;
  return LanguageAwarePage;
}
