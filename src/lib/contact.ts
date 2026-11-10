/** How a visitor reaches sales. One place, so the number never drifts between pages. */
export const WHATSAPP_NUMBER_DISPLAY = "+91 70390 38842";

const WHATSAPP_NUMBER = "917039038842";
const WHATSAPP_GREETING = "Hi, I'd like a demo of Alayn for my restaurant.";

/** Opens a WhatsApp chat with sales, with the first message already typed. */
export const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_GREETING)}`;
