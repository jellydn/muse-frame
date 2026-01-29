import { createFileRoute } from "@tanstack/react-router";
import { getStylesByCategory, type PortraitStyle, type StyleCategory } from "~/lib/styles";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Muse Frame</h1>
          <p>
            Transform your photos into stunning AI-generated personalized portraits. Choose from a
            variety of artistic styles and create something magical.
          </p>
        </div>
      </section>

      {/* Styles Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Choose Your Style</h2>

          {/* Girls Category */}
          <div className="category-section">
            <h3 className="category-title girls">For Girls</h3>
            <div className="style-grid">
              {getStylesByCategory("girls").map((style) => (
                <StyleCard key={style.id} style={style} />
              ))}
            </div>
          </div>

          {/* Boys Category */}
          <div className="category-section">
            <h3 className="category-title boys">For Boys</h3>
            <div className="style-grid">
              {getStylesByCategory("boys").map((style) => (
                <StyleCard key={style.id} style={style} />
              ))}
            </div>
          </div>

          {/* Unisex Category */}
          <div className="category-section">
            <h3 className="category-title unisex">Unisex</h3>
            <div className="style-grid">
              {getStylesByCategory("unisex").map((style) => (
                <StyleCard key={style.id} style={style} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h4 className="step-title">Choose a Style</h4>
              <p className="step-description">
                Browse our collection and select the perfect artistic style for your portrait.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h4 className="step-title">Upload Your Photo</h4>
              <p className="step-description">
                Upload a clear photo of yourself or your child. We&apos;ll validate it
                automatically.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h4 className="step-title">Get Your Portrait</h4>
              <p className="step-description">
                Our AI creates your personalized portrait and delivers it straight to your email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p> Muse Frame - AI Personalized Portraits</p>
        </div>
      </footer>
    </div>
  );
}

function StyleCard({ style }: { style: PortraitStyle }) {
  const handleClick = () => {
    // Use window.location for navigation with search params
    window.location.href = `/upload?style=${encodeURIComponent(style.id)}`;
  };

  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  // Use a placeholder gradient background if image doesn't exist
  const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "200px",
    objectFit: "cover",
    background: getCategoryGradient(style.category),
  };

  return (
    <div className="style-card" onClick={handleClick} role="button" tabIndex={0}>
      <img
        src={style.previewImage}
        alt={`${style.name} style preview`}
        className="style-card-image"
        style={imageStyle}
        onError={(e) => {
          // Fallback to gradient on error
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const parent = target.parentElement;
          if (parent) {
            parent.style.background = getCategoryGradient(style.category);
          }
        }}
      />
      <div className="style-card-content">
        <h4 className="style-card-name">{style.name}</h4>
        <p className="style-card-description">{style.description}</p>
        <div className="style-card-footer">
          <span className="style-card-price">{formatPrice(style.price)}</span>
          <span className="style-card-cta">Select Style</span>
        </div>
      </div>
    </div>
  );
}

function getCategoryGradient(category: StyleCategory): string {
  switch (category) {
    case "girls":
      return "linear-gradient(135deg, #f8bbd9 0%, #f48fb1 100%)";
    case "boys":
      return "linear-gradient(135deg, #bbdefb 0%, #64b5f6 100%)";
    case "unisex":
      return "linear-gradient(135deg, #c8e6c9 0%, #81c784 100%)";
    default:
      return "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)";
  }
}
