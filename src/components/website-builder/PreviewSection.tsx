interface Section {
  id: string;
  type: 'hero' | 'about' | 'services' | 'testimonials' | 'gallery' | 'contact' | 'cta' | 'features';
  content: any;
  order: number;
}

interface PreviewSectionProps {
  section: Section;
  settings: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    logo?: string;
  };
}

export function PreviewSection({ section, settings }: PreviewSectionProps) {
  const { content, type } = section;
  const primaryColor = settings.primaryColor || '#8B5CF6';
  const secondaryColor = settings.secondaryColor || '#EC4899';

  if (type === 'hero') {
    return (
      <div 
        className="relative min-h-[500px] flex items-center justify-center text-white p-12"
        style={{
          background: content.backgroundImage 
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${content.backgroundImage}) center/cover` 
            : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">{content.title || 'Título'}</h1>
          <p className="text-xl mb-8 opacity-90">{content.subtitle || 'Subtítulo'}</p>
          {content.buttonText && (
            <button 
              className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              {content.buttonText}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'about') {
    return (
      <div className="py-16 px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          {content.image && (
            <img src={content.image} alt="" className="rounded-lg w-full h-64 object-cover" />
          )}
          <div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: primaryColor }}>
              {content.title || 'Sobre'}
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {content.content || 'Conteúdo aqui...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'services' || type === 'features') {
    return (
      <div className="py-16 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primaryColor }}>
            {content.title || (type === 'services' ? 'Serviços' : 'Recursos')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {(content.items || []).map((item: any, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {item.icon && (
                  <img src={item.icon} alt="" className="w-12 h-12 mb-4" />
                )}
                <h3 className="font-bold text-xl mb-2">{item.title || 'Título'}</h3>
                <p className="text-gray-600">{item.description || 'Descrição'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'testimonials') {
    return (
      <div className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primaryColor }}>
            {content.title || 'Depoimentos'}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {(content.items || []).map((item: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  {item.avatar ? (
                    <img src={item.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300" />
                  )}
                  <div className="font-semibold">{item.name || 'Nome'}</div>
                </div>
                <p className="text-gray-600 italic">"{item.text || 'Depoimento...'}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'gallery') {
    return (
      <div className="py-16 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primaryColor }}>
            {content.title || 'Galeria'}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(content.images || []).map((img: string, idx: number) => (
              <img key={idx} src={img} alt="" className="w-full h-48 object-cover rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'contact') {
    return (
      <div className="py-16 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8" style={{ color: primaryColor }}>
            {content.title || 'Contato'}
          </h2>
          <div className="space-y-4 text-gray-600">
            {content.email && <p>📧 {content.email}</p>}
            {content.phone && <p>📱 {content.phone}</p>}
            {content.address && <p>📍 {content.address}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'cta') {
    return (
      <div 
        className="py-20 px-8 text-white text-center"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">{content.title || 'Título'}</h2>
          {content.buttonText && (
            <button className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              {content.buttonText}
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
