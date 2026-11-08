import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { HandText } from '@/components/ui/Typography'
import { initialCrop, MAX_ZOOM, panCrop, zoomCrop, zoomOf, type Crop } from './coverCrop'
import { PROFILE_COVER_SIZE } from './imageResize'

const RATIO = PROFILE_COVER_SIZE.width / PROFILE_COVER_SIZE.height
/** Quanto as setas do teclado movem a imagem (fração da moldura). */
const KEY_STEP = 0.05

type Props = {
  file: Blob
  busy?: boolean
  onCancel: () => void
  onConfirm: (crop: Crop) => void
}

/**
 * "Ajustar a capa": a foto aparece numa moldura na proporção da capa (2:1).
 * Arraste (ou use as setas) para escolher o pedaço e o controle de zoom para aproximar.
 */
export function CoverCropDialog({ file, busy = false, onCancel, onConfirm }: Props) {
  const titleId = useId()
  // A URL temporária é liberada assim que a imagem carrega (o navegador já a decodificou).
  const [url] = useState(() => URL.createObjectURL(file))
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const [crop, setCrop] = useState<Crop | null>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const frame = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  function onLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget
    URL.revokeObjectURL(url)
    setSize({ width, height })
    setCrop(initialCrop(width, height, RATIO))
  }

  function move(dx: number, dy: number) {
    if (size) setCrop((c) => (c ? panCrop(c, size.width, size.height, dx, dy) : c))
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !frame.current) return
    const rect = frame.current.getBoundingClientRect()
    move((e.clientX - drag.current.x) / rect.width, (e.clientY - drag.current.y) / rect.height)
    drag.current = { x: e.clientX, y: e.clientY }
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [KEY_STEP, 0],
      ArrowRight: [-KEY_STEP, 0],
      ArrowUp: [0, KEY_STEP],
      ArrowDown: [0, -KEY_STEP],
    }
    const step = steps[e.key]
    if (step) {
      e.preventDefault()
      move(step[0], step[1])
    }
  }

  const zoom = crop && size ? zoomOf(crop, size.width, size.height, RATIO) : 1

  // No body, fora do formulário do perfil: Enter no zoom não pode salvar o perfil.
  return createPortal(
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-primaryHover/70 sm:items-center"
      onKeyDown={(e) => e.key === 'Escape' && !busy && onCancel()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="rise flex w-full max-w-content-max flex-col gap-4 rounded-t-sheet bg-page p-6 sm:rounded-sheet">
        <h2 id={titleId} className="m-0 font-display italic font-semibold text-3xl text-primary">
          ajustar a capa
        </h2>
        <HandText className="-mt-2 text-sm">arraste a foto para escolher o pedaço que aparece no topo do seu perfil.</HandText>

        <div
          ref={frame}
          role="img"
          aria-label="Prévia da capa. Use as setas para mover a foto."
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onKeyDown={onKeyDown}
          className="relative aspect-[2/1] w-full cursor-grab touch-none overflow-hidden rounded-card bg-tag select-none active:cursor-grabbing"
        >
          {url && (
            <img
              src={url}
              alt=""
              draggable={false}
              onLoad={onLoad}
              className="pointer-events-none absolute max-w-none"
              style={
                crop && size
                  ? {
                      width: `${(size.width / crop.sw) * 100}%`,
                      height: `${(size.height / crop.sh) * 100}%`,
                      left: `${(-crop.sx / crop.sw) * 100}%`,
                      top: `${(-crop.sy / crop.sh) * 100}%`,
                    }
                  : { opacity: 0 }
              }
            />
          )}
        </div>

        <label className="flex items-center gap-3">
          <span className="font-sans text-2xs font-semibold uppercase tracking-label text-primary">Zoom</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={!crop}
            onChange={(e) => size && setCrop((c) => (c ? zoomCrop(c, size.width, size.height, RATIO, Number(e.target.value)) : c))}
            className="flex-1 accent-primary"
          />
        </label>

        <div className="flex gap-2.5">
          <Button variant="quiet" onClick={onCancel} disabled={busy} className="flex-1">
            cancelar
          </Button>
          <Button ref={confirmRef} onClick={() => crop && onConfirm(crop)} disabled={!crop} loading={busy} className="flex-1">
            usar esta capa
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
