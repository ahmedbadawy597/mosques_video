import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'soft' | 'gold' | 'muted' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn btn-primary',
  soft: 'btn btn-soft',
  gold: 'btn btn-gold',
  muted: 'btn btn-muted',
  danger: 'btn btn-danger',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={`${VARIANT_CLASS[variant]} ${className}`.trim()} {...rest}>
      {children}
    </button>
  )
}
