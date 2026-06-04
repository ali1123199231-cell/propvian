import { useState } from 'react'
import { Wand2, Loader2, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import type { WebsiteSection, WebsiteConfig } from '@/api/websiteBuilder'

interface Props {
  section: WebsiteSection | null
  config: WebsiteConfig
  onUpdateSection: (id: string, patch: Partial<WebsiteSection>) => void
  onUpdateConfig: (patch: Partial<WebsiteConfig>) => void
  orgId: string
}

const FONTS = ['Inter', 'Lato', 'Poppins', 'Merriweather', 'Playfair Display', 'DM Sans', 'Cormorant']
const THEME_STYLES = ['modern', 'luxury', 'coastal', 'rustic', 'boutique', 'minimal']

export function PropertiesPanel({ section, config, onUpdateSection, onUpdateConfig, orgId }: Props) {
  const [tab, setTab] = useState<'content' | 'style'>('content')
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [globalTab, setGlobalTab] = useState<'theme' | 'seo' | 'conversion' | 'analytics' | 'code'>('theme')

  const setCfg = (patch: Record<string, any>) => {
    if (!section) return
    onUpdateSection(section.id, { config: { ...section.config, ...patch } })
  }

  const mockGenerate = async (type: string, field: string) => {
    setAiLoading(type)
    await new Promise(r => setTimeout(r, 1200))
    const examples: Record<string, string> = {
      headline: 'Your Perfect Getaway Awaits',
      subheadline: 'Book direct for the best rates and a genuinely personal experience',
      description: 'Welcome to our beautifully designed space, where every detail has been thoughtfully curated for your comfort. Enjoy modern amenities, breathtaking surroundings, and the warmth of genuine hospitality.',
      seo_title: `Book Direct — ${config.brandName || 'Our Property'} | Best Rates`,
      meta_description: `Discover ${config.brandName || 'our stunning property'} and book direct for the best rates. Instant confirmation, personalized service, and an unforgettable stay guaranteed.`,
    }
    if (section) setCfg({ [field]: examples[type] || `AI-generated ${type}` })
    if (type === 'seo_title') onUpdateConfig({ pageTitle: examples.seo_title })
    if (type === 'meta_description') onUpdateConfig({ metaDescription: examples.meta_description })
    setAiLoading(null)
  }

  const AiBtn = ({ type, field, label }: { type: string; field: string; label: string }) => (
    <button
      onClick={() => mockGenerate(type, field)}
      disabled={aiLoading === type}
      className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50"
    >
      {aiLoading === type ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
      {label}
    </button>
  )

  if (!section) {
    // Global settings
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Global Settings</p>
        </div>

        <div className="flex border-b border-gray-200 overflow-x-auto">
          {(['theme', 'seo', 'conversion', 'analytics', 'code'] as const).map(t => (
            <button
              key={t}
              onClick={() => setGlobalTab(t)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap capitalize transition-colors border-b-2 ${
                globalTab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {globalTab === 'theme' && (
            <>
              <Field label="Brand Name">
                <input value={config.brandName || ''} onChange={e => onUpdateConfig({ brandName: e.target.value })} className="input-base text-xs" />
              </Field>
              <Field label="Theme Style">
                <select value={config.themeStyle} onChange={e => onUpdateConfig({ themeStyle: e.target.value })} className="input-base text-xs capitalize">
                  {THEME_STYLES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Font Family">
                <select value={config.fontFamily} onChange={e => onUpdateConfig({ fontFamily: e.target.value })} className="input-base text-xs">
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Primary Color">
                <ColorInput value={config.primaryColor} onChange={v => onUpdateConfig({ primaryColor: v })} />
              </Field>
              <Field label="Accent Color">
                <ColorInput value={config.accentColor} onChange={v => onUpdateConfig({ accentColor: v })} />
              </Field>
              <Field label="Button Style">
                <select value={config.buttonStyle} onChange={e => onUpdateConfig({ buttonStyle: e.target.value })} className="input-base text-xs capitalize">
                  {['rounded', 'square', 'pill'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </>
          )}

          {globalTab === 'seo' && (
            <>
              <Field label="Page Title">
                <input value={config.pageTitle || ''} onChange={e => onUpdateConfig({ pageTitle: e.target.value })} className="input-base text-xs" placeholder="Book direct — My Property" />
                <AiBtn type="seo_title" field="" label="Generate with AI" />
              </Field>
              <Field label="Meta Description">
                <textarea value={config.metaDescription || ''} onChange={e => onUpdateConfig({ metaDescription: e.target.value })} rows={3} className="input-base text-xs resize-none" />
                <AiBtn type="meta_description" field="" label="Generate with AI" />
              </Field>
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                <p className="font-semibold mb-1">SEO Preview</p>
                <p className="text-blue-800 font-medium truncate">{config.pageTitle || 'Your page title'}</p>
                <p className="text-green-600 text-xs">propvian.com/host/your-property</p>
                <p className="text-gray-600 line-clamp-2 mt-0.5">{config.metaDescription || 'Your meta description'}</p>
              </div>
            </>
          )}

          {globalTab === 'conversion' && (
            <>
              <ToggleField
                label="Sticky Book Button"
                desc="Show a persistent 'Book Now' button on mobile"
                checked={config.stickyBookButton}
                onChange={v => onUpdateConfig({ stickyBookButton: v })}
              />
              <ToggleField
                label="Exit Intent Offer"
                desc="Show a discount when guests try to leave"
                checked={config.exitIntentEnabled}
                onChange={v => onUpdateConfig({ exitIntentEnabled: v })}
              />
              {config.exitIntentEnabled && (
                <>
                  <Field label="Exit Intent Message">
                    <input value={config.exitIntentMessage || ''} onChange={e => onUpdateConfig({ exitIntentMessage: e.target.value })} className="input-base text-xs" placeholder="Wait! Get 10% off if you book now." />
                  </Field>
                  <Field label="Discount %">
                    <input type="number" min={1} max={50} value={config.exitIntentDiscount || ''} onChange={e => onUpdateConfig({ exitIntentDiscount: Number(e.target.value) })} className="input-base text-xs" />
                  </Field>
                </>
              )}
              <ToggleField
                label="Countdown Timer"
                desc="Create urgency with a limited-time offer"
                checked={config.countdownEnabled}
                onChange={v => onUpdateConfig({ countdownEnabled: v })}
              />
              {config.countdownEnabled && (
                <>
                  <Field label="Countdown Message">
                    <input value={config.countdownMessage || ''} onChange={e => onUpdateConfig({ countdownMessage: e.target.value })} className="input-base text-xs" placeholder="Summer special ends soon!" />
                  </Field>
                  <Field label="Ends On">
                    <input type="date" value={config.countdownEndDate?.split('T')[0] || ''} onChange={e => onUpdateConfig({ countdownEndDate: e.target.value })} className="input-base text-xs" />
                  </Field>
                </>
              )}
            </>
          )}

          {globalTab === 'analytics' && (
            <>
              <Field label="Google Analytics ID">
                <input value={config.gaTrackingId || ''} onChange={e => onUpdateConfig({ gaTrackingId: e.target.value })} className="input-base text-xs font-mono" placeholder="G-XXXXXXXXXX" />
              </Field>
              <Field label="GTM Container ID">
                <input value={config.gtmContainerId || ''} onChange={e => onUpdateConfig({ gtmContainerId: e.target.value })} className="input-base text-xs font-mono" placeholder="GTM-XXXXXXX" />
              </Field>
              <Field label="Meta Pixel ID">
                <input value={config.metaPixelId || ''} onChange={e => onUpdateConfig({ metaPixelId: e.target.value })} className="input-base text-xs font-mono" placeholder="123456789..." />
              </Field>
              <Field label="TikTok Pixel ID">
                <input value={config.tiktokPixelId || ''} onChange={e => onUpdateConfig({ tiktokPixelId: e.target.value })} className="input-base text-xs font-mono" placeholder="..." />
              </Field>
            </>
          )}

          {globalTab === 'code' && (
            <>
              <Field label="Custom CSS">
                <textarea value={config.customCss || ''} onChange={e => onUpdateConfig({ customCss: e.target.value })} rows={5} className="input-base text-xs font-mono resize-none" placeholder=".booking-btn { ... }" />
              </Field>
              <Field label="Header Scripts">
                <textarea value={config.customHeadJs || ''} onChange={e => onUpdateConfig({ customHeadJs: e.target.value })} rows={4} className="input-base text-xs font-mono resize-none" placeholder="<script>...</script>" />
              </Field>
              <Field label="Footer Scripts">
                <textarea value={config.customFooterJs || ''} onChange={e => onUpdateConfig({ customFooterJs: e.target.value })} rows={4} className="input-base text-xs font-mono resize-none" placeholder="<script>...</script>" />
              </Field>
            </>
          )}
        </div>
      </div>
    )
  }

  // Section-specific editor
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-700">{section.sectionType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
        <p className="text-xs text-gray-400">Edit section properties</p>
      </div>

      <div className="flex border-b border-gray-200">
        {(['content', 'style'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors border-b-2 ${
              tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'content' && <SectionContentEditor section={section} setCfg={setCfg} mockGenerate={mockGenerate} aiLoading={aiLoading} onUpdateSection={onUpdateSection} />}
        {tab === 'style' && <SectionStyleEditor section={section} setCfg={setCfg} config={config} />}
      </div>
    </div>
  )
}

function SectionContentEditor({ section, setCfg, mockGenerate, aiLoading, onUpdateSection }: {
  section: WebsiteSection
  setCfg: (patch: Record<string, any>) => void
  mockGenerate: (type: string, field: string) => Promise<void>
  aiLoading: string | null
  onUpdateSection: (id: string, patch: Partial<WebsiteSection>) => void
}) {
  const cfg = section.config

  const AiBtn = ({ type, field }: { type: string; field: string }) => (
    <button onClick={() => mockGenerate(type, field)} disabled={aiLoading === type}
      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50 mt-1">
      {aiLoading === type ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
      AI Generate
    </button>
  )

  const toggle = () => onUpdateSection(section.id, { enabled: !section.enabled })

  switch (section.sectionType) {
    case 'hero':
      return (
        <>
          <Field label="Headline">
            <input value={cfg.headline || ''} onChange={e => setCfg({ headline: e.target.value })} className="input-base text-xs" />
            <AiBtn type="headline" field="headline" />
          </Field>
          <Field label="Subheadline">
            <textarea value={cfg.subheadline || ''} onChange={e => setCfg({ subheadline: e.target.value })} rows={2} className="input-base text-xs resize-none" />
            <AiBtn type="subheadline" field="subheadline" />
          </Field>
          <Field label="CTA Button Text">
            <input value={cfg.ctaText || ''} onChange={e => setCfg({ ctaText: e.target.value })} className="input-base text-xs" placeholder="Check Availability" />
          </Field>
          <Field label="Hero Height">
            <select value={cfg.height || 'large'} onChange={e => setCfg({ height: e.target.value })} className="input-base text-xs">
              <option value="small">Small (260px)</option>
              <option value="medium">Medium (340px)</option>
              <option value="large">Large (440px)</option>
            </select>
          </Field>
          <Field label="Overlay Opacity">
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={0.8} step={0.05}
                value={cfg.overlayOpacity ?? 0.4}
                onChange={e => setCfg({ overlayOpacity: parseFloat(e.target.value) })}
                className="flex-1" />
              <span className="text-xs text-gray-600 w-8">{Math.round((cfg.overlayOpacity ?? 0.4) * 100)}%</span>
            </div>
          </Field>
          <SectionVisibilityToggle section={section} onToggle={toggle} />
        </>
      )

    case 'about':
      return (
        <>
          <Field label="Title">
            <input value={cfg.title || ''} onChange={e => setCfg({ title: e.target.value })} className="input-base text-xs" />
          </Field>
          <Field label="Description">
            <textarea value={cfg.description || ''} onChange={e => setCfg({ description: e.target.value })} rows={5} className="input-base text-xs resize-none" />
            <AiBtn type="description" field="description" />
          </Field>
          <Field label="Image Position">
            <select value={cfg.imagePosition || 'right'} onChange={e => setCfg({ imagePosition: e.target.value })} className="input-base text-xs">
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </Field>
          <SectionVisibilityToggle section={section} onToggle={toggle} />
        </>
      )

    case 'gallery':
      return (
        <>
          <Field label="Columns">
            <select value={cfg.columns || 3} onChange={e => setCfg({ columns: Number(e.target.value) })} className="input-base text-xs">
              <option value={2}>2 columns</option>
              <option value={3}>3 columns</option>
              <option value={4}>4 columns</option>
            </select>
          </Field>
          <ToggleField label="Lightbox" desc="Enable full-screen photo viewer" checked={cfg.lightbox ?? true} onChange={v => setCfg({ lightbox: v })} />
          <ToggleField label="Show Captions" desc="Display captions below photos" checked={cfg.showCaptions ?? false} onChange={v => setCfg({ showCaptions: v })} />
          <SectionVisibilityToggle section={section} onToggle={toggle} />
        </>
      )

    case 'booking-widget':
      return (
        <>
          <Field label="Widget Title">
            <input value={cfg.title || ''} onChange={e => setCfg({ title: e.target.value })} className="input-base text-xs" />
          </Field>
          <Field label="Check-in Note">
            <input value={cfg.checkInNote || ''} onChange={e => setCfg({ checkInNote: e.target.value })} className="input-base text-xs" placeholder="Check-in from 3:00 PM" />
          </Field>
          <Field label="Check-out Note">
            <input value={cfg.checkOutNote || ''} onChange={e => setCfg({ checkOutNote: e.target.value })} className="input-base text-xs" placeholder="Check-out by 11:00 AM" />
          </Field>
          <ToggleField label="Show Pricing" desc="Display price breakdown" checked={cfg.showPricing ?? true} onChange={v => setCfg({ showPricing: v })} />
          <ToggleField label="Instant Booking" desc="Allow guests to book immediately" checked={cfg.instantBooking ?? true} onChange={v => setCfg({ instantBooking: v })} />
          <SectionVisibilityToggle section={section} onToggle={toggle} />
        </>
      )

    case 'faq':
      return (
        <>
          <Field label="Title">
            <input value={cfg.title || ''} onChange={e => setCfg({ title: e.target.value })} className="input-base text-xs" />
          </Field>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">FAQ Items</p>
            <div className="space-y-2">
              {((cfg.items as any[]) || []).map((item: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <input
                      value={item.q}
                      onChange={e => { const items = [...(cfg.items as any[])]; items[i] = { ...item, q: e.target.value }; setCfg({ items }) }}
                      className="input-base text-xs flex-1"
                      placeholder="Question"
                    />
                    <button onClick={() => { const items = (cfg.items as any[]).filter((_: any, j: number) => j !== i); setCfg({ items }) }}
                      className="p-1 text-red-400 hover:text-red-600 flex-shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <textarea
                    value={item.a}
                    onChange={e => { const items = [...(cfg.items as any[])]; items[i] = { ...item, a: e.target.value }; setCfg({ items }) }}
                    rows={2}
                    className="input-base text-xs resize-none w-full"
                    placeholder="Answer"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setCfg({ items: [...((cfg.items as any[]) || []), { q: '', a: '' }] })}
              className="mt-2 flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              <Plus size={12} /> Add FAQ item
            </button>
          </div>
          <SectionVisibilityToggle section={section} onToggle={toggle} />
        </>
      )

    case 'house-rules':
      return (
        <>
          <Field label="Title">
            <input value={cfg.title || ''} onChange={e => setCfg({ title: e.target.value })} className="input-base text-xs" />
          </Field>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Rules</p>
            <div className="space-y-2">
              {((cfg.rules as any[]) || []).map((rule: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={rule.icon} onChange={e => { const rules = [...(cfg.rules as any[])]; rules[i] = { ...rule, icon: e.target.value }; setCfg({ rules }) }}
                    className="input-base text-xs w-12 text-center" placeholder="🚫" />
                  <input value={rule.text} onChange={e => { const rules = [...(cfg.rules as any[])]; rules[i] = { ...rule, text: e.target.value }; setCfg({ rules }) }}
                    className="input-base text-xs flex-1" placeholder="Rule description" />
                  <button onClick={() => { const rules = (cfg.rules as any[]).filter((_: any, j: number) => j !== i); setCfg({ rules }) }}
                    className="p-1 text-red-400 hover:text-red-600 flex-shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setCfg({ rules: [...((cfg.rules as any[]) || []), { icon: '✅', text: '' }] })}
              className="mt-2 flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium">
              <Plus size={12} /> Add rule
            </button>
          </div>
          <SectionVisibilityToggle section={section} onToggle={toggle} />
        </>
      )

    case 'host-info':
      return (
        <>
          <Field label="Section Title">
            <input value={cfg.title || ''} onChange={e => setCfg({ title: e.target.value })} className="input-base text-xs" />
          </Field>
          <Field label="Host Name">
            <input value={cfg.hostName || ''} onChange={e => setCfg({ hostName: e.target.value })} className="input-base text-xs" />
          </Field>
          <Field label="Host Bio">
            <textarea value={cfg.hostBio || ''} onChange={e => setCfg({ hostBio: e.target.value })} rows={4} className="input-base text-xs resize-none" />
            <AiBtn type="description" field="hostBio" />
          </Field>
          <ToggleField label="Show Contact Button" desc="Allow guests to message you" checked={cfg.showContactButton ?? true} onChange={v => setCfg({ showContactButton: v })} />
          <SectionVisibilityToggle section={section} onToggle={toggle} />
        </>
      )

    case 'cta':
      return (
        <>
          <Field label="Headline">
            <input value={cfg.title || ''} onChange={e => setCfg({ title: e.target.value })} className="input-base text-xs" />
          </Field>
          <Field label="Subtitle">
            <input value={cfg.subtitle || ''} onChange={e => setCfg({ subtitle: e.target.value })} className="input-base text-xs" />
          </Field>
          <Field label="Button Text">
            <input value={cfg.buttonText || ''} onChange={e => setCfg({ buttonText: e.target.value })} className="input-base text-xs" />
          </Field>
          <SectionVisibilityToggle section={section} onToggle={toggle} />
        </>
      )

    case 'contact':
      return (
        <>
          <Field label="Title">
            <input value={cfg.title || ''} onChange={e => setCfg({ title: e.target.value })} className="input-base text-xs" />
          </Field>
          <Field label="Subtitle">
            <input value={cfg.subtitle || ''} onChange={e => setCfg({ subtitle: e.target.value })} className="input-base text-xs" />
          </Field>
          <ToggleField label="Show Phone" checked={cfg.showPhone ?? true} onChange={v => setCfg({ showPhone: v })} />
          <ToggleField label="Show Email" checked={cfg.showEmail ?? true} onChange={v => setCfg({ showEmail: v })} />
          <SectionVisibilityToggle section={section} onToggle={toggle} />
        </>
      )

    case 'reviews':
      return (
        <>
          <Field label="Title">
            <input value={cfg.title || ''} onChange={e => setCfg({ title: e.target.value })} className="input-base text-xs" />
          </Field>
          <Field label="Layout">
            <select value={cfg.layout || 'grid'} onChange={e => setCfg({ layout: e.target.value })} className="input-base text-xs">
              <option value="grid">Grid</option>
              <option value="carousel">Carousel</option>
              <option value="list">List</option>
            </select>
          </Field>
          <ToggleField label="Show Star Rating" checked={cfg.showRating ?? true} onChange={v => setCfg({ showRating: v })} />
          <SectionVisibilityToggle section={section} onToggle={toggle} />
        </>
      )

    case 'location':
      return (
        <>
          <Field label="Title">
            <input value={cfg.title || ''} onChange={e => setCfg({ title: e.target.value })} className="input-base text-xs" />
          </Field>
          <Field label="Description">
            <textarea value={cfg.description || ''} onChange={e => setCfg({ description: e.target.value })} rows={3} className="input-base text-xs resize-none" />
          </Field>
          <ToggleField label="Show Map" checked={cfg.showMap ?? true} onChange={v => setCfg({ showMap: v })} />
          <SectionVisibilityToggle section={section} onToggle={toggle} />
        </>
      )

    case 'footer':
      return (
        <>
          <Field label="Copyright Text">
            <input value={cfg.copyright || ''} onChange={e => setCfg({ copyright: e.target.value })} className="input-base text-xs" placeholder="All rights reserved" />
          </Field>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Links</p>
            <div className="space-y-2">
              {((cfg.links as any[]) || []).map((link: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={link.label} onChange={e => { const links = [...(cfg.links as any[])]; links[i] = { ...link, label: e.target.value }; setCfg({ links }) }}
                    className="input-base text-xs w-24" placeholder="Label" />
                  <input value={link.url} onChange={e => { const links = [...(cfg.links as any[])]; links[i] = { ...link, url: e.target.value }; setCfg({ links }) }}
                    className="input-base text-xs flex-1" placeholder="/page" />
                  <button onClick={() => setCfg({ links: (cfg.links as any[]).filter((_: any, j: number) => j !== i) })}
                    className="p-1 text-red-400 hover:text-red-600">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setCfg({ links: [...((cfg.links as any[]) || []), { label: '', url: '' }] })}
              className="mt-2 flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium">
              <Plus size={12} /> Add link
            </button>
          </div>
        </>
      )

    default:
      return (
        <>
          <Field label="Title">
            <input value={cfg.title || ''} onChange={e => setCfg({ title: e.target.value })} className="input-base text-xs" />
          </Field>
          <SectionVisibilityToggle section={section} onToggle={toggle} />
        </>
      )
  }
}

function SectionStyleEditor({ section, setCfg, config: globalConfig }: {
  section: WebsiteSection
  setCfg: (patch: Record<string, any>) => void
  config: WebsiteConfig
}) {
  const cfg = section.config
  return (
    <>
      <Field label="Background Color">
        <div className="flex gap-2">
          {['#FFFFFF', '#F9FAFB', '#F3F4F6', '#EEF2FF', '#F0FDF4', '#1C1917'].map(c => (
            <button
              key={c}
              onClick={() => setCfg({ bgColor: c })}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{ backgroundColor: c, borderColor: cfg.bgColor === c ? globalConfig.primaryColor : '#e5e7eb' }}
            />
          ))}
        </div>
      </Field>
      <Field label="Padding">
        <select value={cfg.padding || 'md'} onChange={e => setCfg({ padding: e.target.value })} className="input-base text-xs">
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
          <option value="xl">Extra Large</option>
        </select>
      </Field>
      <Field label="Text Alignment">
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map(a => (
            <button key={a} onClick={() => setCfg({ textAlign: a })}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${cfg.textAlign === a ? 'bg-primary-50 border-primary-400 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </Field>
    </>
  )
}

function SectionVisibilityToggle({ section, onToggle }: { section: WebsiteSection; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border transition-all w-full ${
        section.enabled
          ? 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'
          : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
      }`}>
      {section.enabled ? <EyeOff size={12} /> : <Eye size={12} />}
      {section.enabled ? 'Hide this section' : 'Show this section'}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="input-base text-xs flex-1 font-mono" />
    </div>
  )
}

function ToggleField({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-gray-700">{label}</p>
        {desc && <p className="text-xs text-gray-400">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}
