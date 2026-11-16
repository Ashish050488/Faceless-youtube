#!/usr/bin/env bash
# Usage: audio/mix.sh voice.wav bed.wav out.mp3
# Benchmark-matched mix: music 15-17 dB under voice, -14 LUFS master, TP -1, full length kept (tail included).
set -euo pipefail
V=$1; B=$2; O=$3
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
FO=$(python3 -c "print(round($D-1.8,2))")
ffmpeg -v error -y -i "$V" -i "$B" -filter_complex "[0:a]aresample=48000,loudnorm=I=-16:TP=-2:LRA=7,apad=whole_dur=$D,asplit=2[v][sc];[1:a]aresample=48000,volume=-11dB,afade=t=in:d=0.4,afade=t=out:st=$FO:d=1.8,atrim=0:$D[m];[m][sc]sidechaincompress=threshold=0.05:ratio=3:attack=120:release=400[md];[v][md]amix=inputs=2:duration=longest:normalize=0,atrim=0:$D,loudnorm=I=-14:TP=-1:LRA=9" -ar 48000 -b:a 192k "$O"
