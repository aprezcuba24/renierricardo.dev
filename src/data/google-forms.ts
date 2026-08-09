export type GoogleFormTheme = 'broker' | 'default';

export type GoogleFormConfig = {
  title: string;
  description: string;
  formEmbedUrl: string;
  backHref: string;
  backLabel: string;
  theme: GoogleFormTheme;
  /** Optional OG image path relative to site root */
  image?: string;
  /** Optional WhatsApp deep link for direct contact after the form */
  whatsappHref?: string;
  /** Display phone, e.g. "+53 53024637" */
  whatsappPhone?: string;
};

const brokerWhatsappPhone = '53024637';
const brokerWhatsappHref = `https://wa.me/53${brokerWhatsappPhone}?text=${encodeURIComponent(
  'Hola, me interesa VendeYa (prelanzamiento). Quiero enterarme cuando esté disponible.',
)}`;

export const googleForms = {
  brokerRegistro: {
    title: 'Interés en VendeYa (prelanzamiento)',
    description:
      'VendeYa aún no está a la venta: estamos captando futuros clientes interesados. Cuéntanos sobre ti y tu negocio; te contactaremos cuando haya novedades del lanzamiento.',
    // Pegar aquí la URL de incrustar de Google Forms (.../viewform?embedded=true)
    formEmbedUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfWpl0cj9rPYozcoPnUUF2A_lmArgpdWCm0FFxws4L1XmhJng/viewform?embedded=true',
    backHref: '/proyectos/broker',
    backLabel: 'VendeYa',
    theme: 'broker',
    image: '/proyectos/broker/01-backoffice-dashboard.png',
    whatsappHref: brokerWhatsappHref,
    whatsappPhone: `+53 ${brokerWhatsappPhone}`,
  },
} satisfies Record<string, GoogleFormConfig>;
