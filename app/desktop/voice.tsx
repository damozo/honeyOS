import {useEffect, useState, useRef, useContext} from 'react';
import {SpeechRecognitionContext} from "@/app/context/speechRecognitionContext";

export default function Voice() {
    const {payload, audioContextRef} = useContext(SpeechRecognitionContext);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const [microphoneName, setMicrophoneName] = useState<string>('Unknown');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyserRef.current = analyser;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

            // MIRCOPHONE NAME
            const audioInputDevices = stream.getAudioTracks().map((track) => track.label);
            if (audioInputDevices.length > 0) {
                setMicrophoneName(audioInputDevices[0]);
            }

            // SOUND WAVE
            const canvas = canvasRef.current;
            if (canvas) {
                const canvasCtx = canvas.getContext('2d');
                if (canvasCtx) {
                    const draw = () => {
                        if (analyser && dataArrayRef.current) {
                            analyser.getByteTimeDomainData(dataArrayRef.current);
                            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                            canvasCtx.fillStyle = 'rgb(0, 0, 0, 0)';
                            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
                            canvasCtx.lineWidth = 3;
                            canvasCtx.strokeStyle = 'rgb(255, 255, 255)';
                            canvasCtx.beginPath();
                            const sliceWidth = canvas.width / analyser.frequencyBinCount;
                            let x = 0;
                            for (let i = 0; i < analyser.frequencyBinCount; i++) {
                                const v = dataArrayRef.current[i] / 128.0;
                                const y = v * canvas.height / 2;
                                if (i === 0) {
                                    canvasCtx.moveTo(x, y);
                                } else {
                                    canvasCtx.lineTo(x, y);
                                }
                                x += sliceWidth;
                            }
                            canvasCtx.lineTo(canvas.width, canvas.height / 2);
                            canvasCtx.stroke();
                        }
                        requestAnimationFrame(draw);
                    };
                    draw();
                }
            }
        });
    }, []);
    return (
        <div className={`font-consolas relative text-white ml-[5vw] mt-[10vh] w-[50vw]absolute w-[40vw] h-[25vh] 
        bg-black/40 blur-none backdrop-blur-sm top-0 -z-100`}>
            <div className="blur-none z-20 p-[2vh] mr-[5vw] break-words">
                MICROPHONE: {microphoneName}
            </div>
            <div className={`blur-none z-20 pl-[2vh] mr-[5vw] break-words overflow-x-auto
             min-h-[4vh] max-h-[4vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent`}>
                {payload}
            </div>
            <div className="blur-none flex justify-center w-[40vw]">
               <canvas ref={canvasRef} className={`w-full p-1 h-[100px]`}></canvas>
            </div>
        </div>
    );
}
