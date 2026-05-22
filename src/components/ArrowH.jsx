export default function ArrowH({ color = '#6b7084' }) {
  return (
    <div className="arrow-h">
      <svg width="28" height="16">
        <path
          d="M0 8h20m0 0l-5-4m5 4l-5 4"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    </div>
  );
}
