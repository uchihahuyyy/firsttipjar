import { useState } from 'react'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useReadContract,
} from 'wagmi'
import { erc20Abi } from 'viem'
import { ConnectKitButton } from 'connectkit'
import { Loader2, ExternalLink, Heart, Coffee, Star, Zap } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { getUsdc, requireChain, buildTxExplorerUrl } from '@/onchain-facts'
import { parseAmount, Amount, usdcDecimalsFor } from '@/onchain-money'

// ---------- CONFIG: replace this placeholder with your real recipient address ----------
export const RECIPIENT_ADDRESS = '0xbA6B260Ab655465a74b315766943aa2468936E3c' as `0x${string}`
// --------------------------------------------------------------------------------------

const TARGET_CHAIN_ID = 5042002 // Arc Testnet

const usdcFact = getUsdc(TARGET_CHAIN_ID)!
const chainFact = requireChain(TARGET_CHAIN_ID)

const PRESET_AMOUNTS = [
  { label: '$0.01', value: '0.01', icon: Coffee },
  { label: '$0.05', value: '0.05', icon: Heart },
  { label: '$0.10', value: '0.10', icon: Star },
  { label: '$0.25', value: '0.25', icon: Zap },
]

const glass = {
  card: {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(18,45,69,0.12)',
    borderRadius: '1.5rem',
  } as React.CSSProperties,
  inner: {
    background: 'rgba(255,255,255,0.60)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(18,45,69,0.10)',
    borderRadius: '1rem',
  } as React.CSSProperties,
}

function parseOnchainError(error: unknown): string {
  const message = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (message.includes('user rejected') || (error as { code?: number })?.code === 4001) {
    return 'Transaction cancelled.'
  }
  if (message.includes('insufficient funds') || message.includes('exceeds balance')) {
    return 'Insufficient balance. Please add funds and try again.'
  }
  if (message.includes('reverted')) {
    const match = message.match(/reason="([^"]+)"/)
    return match ? `Transaction failed: ${match[1]}` : 'Transaction failed. Please try again.'
  }
  if (message.includes('network') || message.includes('timeout')) {
    return 'Network error. Please check connection and retry.'
  }
  return 'Something went wrong. Please try again.'
}

export default function TipJar() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [selectedPreset, setSelectedPreset] = useState<string | null>('0.05')
  const [customAmount, setCustomAmount] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const { data: rawBalance } = useReadContract({
    address: usdcFact.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: { enabled: !!address },
  })

  const formattedBalance =
    rawBalance != null
      ? Amount.fromRaw(rawBalance, usdcDecimalsFor(TARGET_CHAIN_ID)).toFixed(2)
      : null

  const activeAmount = useCustom ? customAmount : (selectedPreset ?? '')
  const isWrongChain = isConnected && chainId !== TARGET_CHAIN_ID
  const isRecipientPlaceholder = RECIPIENT_ADDRESS === '0x0000000000000000000000000000000000000000'

  const amountValid = (() => {
    if (!activeAmount) return false
    const n = parseFloat(activeAmount)
    return !isNaN(n) && n > 0
  })()

  const canSend =
    isConnected &&
    !isWrongChain &&
    amountValid &&
    !isPending &&
    !isConfirming &&
    !isRecipientPlaceholder

  const handleSend = () => {
    if (!canSend) return
    const parsed = parseAmount(TARGET_CHAIN_ID, activeAmount)
    writeContract({
      address: usdcFact.address as `0x${string}`,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [RECIPIENT_ADDRESS, parsed.raw],
      chainId: TARGET_CHAIN_ID,
    })
  }

  const handleReset = () => {
    reset()
    setCustomAmount('')
    setSelectedPreset('0.05')
    setUseCustom(false)
  }

  const txUrl = hash ? buildTxExplorerUrl(TARGET_CHAIN_ID, hash) : undefined

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">

        {/* Header */}
        <div className="text-center space-y-1 mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className="flex size-12 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(18,45,69,0.08)', border: '1px solid rgba(18,45,69,0.12)' }}
            >
              <Coffee className="size-6" style={{ color: 'var(--accent)' }} />
            </div>
          </div>
          <h1 className="display text-3xl font-bold" style={{ color: 'var(--ink)' }}>
            Tip Jar
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Send USDC tips on Arc Testnet
          </p>
        </div>

        {/* Wallet connect */}
        <div className="flex justify-center">
          <ConnectKitButton />
        </div>

        {/* Balance */}
        {isConnected && formattedBalance !== null && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            <TokenUSDC variant="branded" size={16} />
            <span className="text-sm tabular-nums" style={{ color: 'var(--muted)' }}>
              Balance: <strong style={{ color: 'var(--ink)' }}>{formattedBalance} USDC</strong>
            </span>
          </div>
        )}

        {/* Wrong chain banner */}
        {isWrongChain && (
          <div
            className="rounded-2xl p-4 text-center text-sm"
            style={{ background: 'rgba(186,43,76,0.07)', border: '1px solid rgba(186,43,76,0.2)' }}
          >
            <p style={{ color: 'var(--danger)' }}>
              Please switch to <strong>{chainFact.name}</strong> to send tips.
            </p>
            <button
              onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
              disabled={isSwitching}
              className="mt-2 text-xs font-semibold underline underline-offset-2 disabled:opacity-50"
              style={{ color: 'var(--danger)' }}
            >
              {isSwitching ? 'Switching...' : 'Switch Network'}
            </button>
          </div>
        )}

        {/* Recipient placeholder warning */}
        {isRecipientPlaceholder && (
          <div
            className="rounded-2xl p-4 text-sm"
            style={{ background: 'rgba(186,43,76,0.07)', border: '1px solid rgba(186,43,76,0.2)' }}
          >
            <p style={{ color: 'var(--danger)' }}>
              <strong>Setup required:</strong> Open{' '}
              <code className="mono text-xs bg-black/5 px-1 py-0.5 rounded">
                src/components/TipJar.tsx
              </code>{' '}
              and replace <code className="mono text-xs bg-black/5 px-1 py-0.5 rounded">RECIPIENT_ADDRESS</code> with
              your wallet address.
            </p>
          </div>
        )}

        {/* Success state */}
        {isSuccess && txUrl && (
          <div style={glass.card} className="p-5 text-center space-y-3">
            <div
              className="mx-auto flex size-12 items-center justify-center rounded-full"
              style={{ background: 'rgba(26,128,71,0.12)' }}
            >
              <Heart className="size-6" style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <p className="display text-lg font-bold" style={{ color: 'var(--success)' }}>
                Tip sent!
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                ${activeAmount || selectedPreset} USDC on its way
              </p>
            </div>
            <a
              href={txUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: 'var(--accent-hover)' }}
            >
              View on ArcScan <ExternalLink className="size-3" />
            </a>
            <button
              onClick={handleReset}
              className="mt-2 w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink)' }}
            >
              Send another tip
            </button>
          </div>
        )}

        {/* Tip form */}
        {!isSuccess && (
          <div style={glass.card} className="p-5 space-y-4">

            {/* Preset buttons */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--subtle)' }}>
                Quick tip
              </p>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map(({ label, value, icon: Icon }) => {
                  const active = !useCustom && selectedPreset === value
                  return (
                    <button
                      key={value}
                      onClick={() => { setSelectedPreset(value); setUseCustom(false) }}
                      className="flex flex-col items-center gap-1.5 rounded-xl py-3 text-sm font-semibold transition-all hover:scale-[1.03] active:scale-[0.97]"
                      style={
                        active
                          ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
                          : { background: 'var(--surface-muted)', color: 'var(--ink)', border: '1.5px solid transparent' }
                      }
                    >
                      <Icon className="size-4" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--subtle)' }}>
                Custom amount
              </p>
              <div
                style={useCustom
                  ? { ...glass.inner, border: '1.5px solid var(--accent)' }
                  : glass.inner
                }
                className="p-3 flex items-center gap-2"
              >
                <TokenUSDC variant="branded" size={20} />
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, '')
                    if (v === '' || /^\d*\.?\d*$/.test(v)) {
                      setCustomAmount(v)
                      setUseCustom(true)
                      setSelectedPreset(null)
                    }
                  }}
                  onFocus={() => { setUseCustom(true); setSelectedPreset(null) }}
                  className="display flex-1 bg-transparent text-2xl font-bold tabular-nums outline-none placeholder:text-slate-300"
                  style={{ color: 'var(--ink)' }}
                />
                <span className="text-sm font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
              </div>
              {formattedBalance !== null && (
                <button
                  onClick={() => { setCustomAmount(formattedBalance); setUseCustom(true); setSelectedPreset(null) }}
                  className="mt-1.5 text-xs font-medium"
                  style={{ color: 'var(--accent-hover)' }}
                >
                  Max: {formattedBalance} USDC
                </button>
              )}
            </div>

            {/* Error display */}
            {writeError && (
              <p className="text-sm rounded-xl px-3 py-2" style={{ background: 'rgba(186,43,76,0.07)', color: 'var(--danger)' }}>
                {parseOnchainError(writeError)}
              </p>
            )}

            {/* CTA */}
            {!isConnected ? (
              <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                Connect your wallet above to send a tip.
              </p>
            ) : (
              <button
                disabled={!canSend}
                onClick={handleSend}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                {isWrongChain
                  ? 'Switch to Arc Testnet'
                  : isPending
                  ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Confirm in wallet...
                    </span>
                  )
                  : isConfirming
                  ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Confirming...
                    </span>
                  )
                  : isRecipientPlaceholder
                  ? 'Set recipient address first'
                  : `Send $${activeAmount || '—'} tip`}
              </button>
            )}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs" style={{ color: 'var(--subtle)' }}>
          Powered by USDC on Arc Testnet · Fees paid in USDC
        </p>
      </div>
    </div>
  )
}
