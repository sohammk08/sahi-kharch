// Animated spinner component (used in Hero)

function SpinningText({
  children,
  className,
  radius = 5,
  duration = 10,
  reverse = false,
}) {
  const text = Array.isArray(children) ? children.join("") : children;
  const letters = text.split("").concat(" ");
  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{
        animation: `spin360 ${duration}s linear infinite`,
        animationDirection: reverse ? "reverse" : "normal",
      }}
    >
      {letters.map((letter, i) => (
        <span
          key={`${i}-${letter}`}
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 inline-block"
          style={{
            transform: `translate(-50%, -50%) rotate(${(360 / letters.length) * i}deg) translateY(${-radius}ch)`,
          }}
        >
          {letter}
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </div>
  );
}

export default SpinningText;
