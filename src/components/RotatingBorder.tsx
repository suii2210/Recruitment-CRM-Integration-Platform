const RotatingBorder = ({
  children,
  className = '',
  color = '#22d3ee',
  speed = '2s'
}) => {
  return (
    <div className={`relative ${className}`}>
      <div 
        className="absolute inset-0 rounded-[12px] opacity-75"
        style={{
          background: `conic-gradient(from 0deg, transparent, ${color}, transparent)`,
          animation: `spin ${speed} linear infinite`,
          padding: '2px'
        }}
      />
      <div className="relative z-10 rounded-[12px] overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default RotatingBorder;