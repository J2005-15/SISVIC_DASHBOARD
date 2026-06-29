// ─── ASSETS ESTÁTICOS EN CLOUDINARY ─────────────────────────────────────────
// Placeholders de desarrollo, servidos desde el cloud_name de demo público
// de Cloudinary (no requiere credenciales para leer). Reemplaza CLOUD_NAME
// por el cloud_name real del proyecto (el mismo que usa el backend en
// CLOUDINARY_CLOUD_NAME) en cuanto subas los assets definitivos.
const CLOUD_NAME = 'demo'
const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`

export const IMAGES = {
  LOGO: `${CLOUDINARY_BASE}/w_200,h_200,c_fit/sample.png`,
  BANNER_LOGIN: `${CLOUDINARY_BASE}/w_1200,h_900,c_fill/landscape`,
  AVATAR_DEFAULT: `${CLOUDINARY_BASE}/w_120,h_120,c_thumb,g_face,r_max/face_left`,
  ANIMAL_PLACEHOLDER: `${CLOUDINARY_BASE}/w_400,h_400,c_fill/animals/cat`,
}
export const LOGO = 'https://res.cloudinary.com/dhilpvzef/image/upload/v1782364545/Logo_Nevado_glcikr.png';
export default IMAGES
