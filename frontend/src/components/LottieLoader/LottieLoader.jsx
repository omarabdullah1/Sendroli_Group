import Lottie from 'lottie-react';
import './LottieLoader.css';

// Lottie animation data - simple loading animation
const loadingAnimation = {
  "v": "5.7.4",
  "fr": 30,
  "ip": 0,
  "op": 60,
  "w": 200,
  "h": 200,
  "nm": "Loading",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Circle",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { 
          "a": 1, 
          "k": [
            { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 0, "s": [0] },
            { "t": 60, "s": [360] }
          ]
        },
        "p": { "a": 0, "k": [100, 100, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "p": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [60, 60] }
            },
            {
              "ty": "st",
              "c": { "a": 0, "k": [0.2, 0.8, 0.8, 1] },
              "o": { "a": 0, "k": 100 },
              "w": { "a": 0, "k": 8 },
              "lc": 2,
              "lj": 2
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 },
              "o": { "a": 0, "k": 100 }
            }
          ]
        }
      ],
      "ip": 0,
      "op": 60,
      "st": 0
    }
  ]
};

const LottieLoader = ({ 
  size = 'medium', 
  message = 'Loading...', 
  fullScreen = false,
  className = '',
  showMessage = true
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'lottie-loader-small';
      case 'large': return 'lottie-loader-large';
      case 'xlarge': return 'lottie-loader-xlarge';
      default: return 'lottie-loader-medium';
    }
  };

  const containerClass = `lottie-loader ${getSizeClass()} ${fullScreen ? 'lottie-loader-fullscreen' : ''} ${className}`.trim();

  return (
    <div className={containerClass}>
      <div className="lottie-animation">
        <Lottie 
          animationData={loadingAnimation}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {showMessage && (
        <div className="lottie-message">
          {message}
        </div>
      )}
    </div>
  );
};

export default LottieLoader;