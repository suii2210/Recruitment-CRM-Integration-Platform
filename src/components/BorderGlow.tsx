const BorderGlow = ({ children, className = '', glowColor = '#22d3ee' }) => {
  return (
    <div className={`relative group ${className}`}>
      <div 
        className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
        style={{
          background: `linear-gradient(45deg, transparent, ${glowColor}, transparent)`
        }}
      />
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;