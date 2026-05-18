import { dump } from '@modules/dumper.ts'

type DumpProps = {
    value: unknown
    label?: string
}

export const Dump = ({ value, label }: DumpProps) => (
    <>
        <style>{`
            .dump { background:#1e1e1e; color:#d4d4d4; padding:1em; overflow:auto; font-size:0.85em; border-radius:4px; white-space:pre-wrap; word-break:break-all; }
            .dump-label { color:#9cdcfe; display:block; margin-bottom:0.5em; }
        `}</style>
        <pre class="dump">
            {label !== undefined && <strong class="dump-label">{label}</strong>}
            {dump(value)}
        </pre>
    </>
)
