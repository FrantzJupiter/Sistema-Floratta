import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sistema Floratta",
    short_name: "Floratta",
    description: "Gerenciamento de Varejo: Perfumaria, Presentes e Semijoias",
    start_url: "/",
    display: "standalone", // Obrigatório para remover a interface do browser
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon-192x192.png", // Lembre-se de colocar essas imagens na pasta /public 
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}