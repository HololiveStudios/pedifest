// src/pages/Tutorials.tsx
import { PlayCircle, BookOpen, Video } from "lucide-react";

export default function Tutorials() {
  const tutorials = [
    {
      id: 1,
      title: "Como criar seu primeiro produto",
      description: "Aprenda a cadastrar produtos com fotos e descrições",
      duration: "5 min",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
      id: 2,
      title: "Gerenciando pedidos em tempo real",
      description: "Veja como aceitar, preparar e finalizar pedidos",
      duration: "8 min",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
      id: 3,
      title: "Criando promoções e combos",
      description: "Configure ofertas especiais para atrair mais clientes",
      duration: "6 min",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
      id: 4,
      title: "Integrando com redes sociais",
      description: "Conecte WhatsApp, Instagram e Facebook",
      duration: "10 min",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tutoriais</h1>
        <p className="text-gray-600">Aprenda a usar todas as funcionalidades do OnPedido</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tutorials.map((tutorial) => (
          <div key={tutorial.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
            <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
              <Video size={48} className="text-gray-400" />
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-3">
                <PlayCircle className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-lg mb-1">{tutorial.title}</h3>
                  <p className="text-gray-600 text-sm">{tutorial.description}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{tutorial.duration}</span>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Assistir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="text-blue-600" size={32} />
          <h2 className="text-2xl font-bold">Precisa de ajuda?</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Acesse nossa central de ajuda para encontrar respostas rápidas ou entre em contato com nosso suporte.
        </p>
        <div className="flex gap-3">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Central de Ajuda
          </button>
          <button className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
            Falar com Suporte
          </button>
        </div>
      </div>
    </div>
  );
}