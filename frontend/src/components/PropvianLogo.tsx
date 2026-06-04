interface PropvianLogoProps {
  size?: number
  showText?: boolean
  textClassName?: string
}

export function PropvianLogo({ size = 32, showText = true, textClassName = 'font-semibold text-gray-900 text-lg' }: PropvianLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/propvian-icon.svg"
        alt="Propvian"
        width={size}
        height={size}
        className="rounded-xl flex-shrink-0"
        style={{ width: size, height: size }}
      />
      {showText && <span className={textClassName}>Propvian</span>}
    </div>
  )
}
