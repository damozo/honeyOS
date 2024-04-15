import React, {useContext, useEffect, useState} from "react";
import WindowScreen from "@/app/desktop/components/window";
import {WindowProps} from "@/app/types";
import {OpenAppsContext} from "@/app/context/openedAppsContext";
import useFont from "@/hooks/useFont";
import {FaRegSave, FaSave} from "react-icons/fa";
import {
    FaCircleCheck,
    FaCircleInfo,
    FaCircleXmark,
    FaNoteSticky,
    FaVolumeHigh,
} from "react-icons/fa6";
import useFileSystem from "@/hooks/useFileSystem";
import {SpeechRecognitionContext} from "@/app/context/speechRecognitionContext";

export default function Note({windowIndex, file}: WindowProps) {
    const {isNoteFocused} = useContext(OpenAppsContext);
    const {montserrat, roboto} = useFont();
    const {writeFile} = useFileSystem();
    const {command} = useContext(SpeechRecognitionContext);
    const [customName, setCustomName] = useState(file?.name);
    const [tempName, setTempName] = useState("");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showNotification, setShowNotification] = useState({
        show: false,
        type: '',
        message: ""
    });
    const [currentContent, setCurrentContent] = useState({
        content: "",
        location: ""
    });
    const [newContent, setNewContent] = useState({
        content: "",
        location: ""
    });
    const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);

    useEffect(() => {
        if(file) {
            console.log('file', file)
            setCurrentContent(file);
            setNewContent(file);
        }
    }, []);

    const saveFile = async (newFileName?: string) => {
        let response : {status: boolean, message: string} = {status: false, message: ""};
        if(newFileName || currentContent.content !== newContent.content) {
            const filename = newFileName ? newFileName + ".txt" : file?.name;
            console.log('new content', newContent)
            response = await writeFile(newContent.location + '\\' + filename, newContent.content);
            if(response.status) {
                setCurrentContent(newContent);
                setShowNotification({show: true, type: 'success', message: response.message});
            } else {
                setShowNotification({show: true, type: 'error', message: response.message});
            }
            setInterval(() => {
                setShowNotification({show: false, type: '', message: ""});
            }, 3000);
        }
        return response.status;
    }

    useEffect(() => {
        if(isNoteFocused) {
            if(showConfirmDialog) {
                if(command.substring(0, 7) === "confirm") {
                    setShowConfirmDialog(false);
                    saveFile(tempName).then(r => {});
                } else if(command.substring(0, 6) === "cancel") {
                    setShowConfirmDialog(false);
                    setShowSaveAsDialog(false);
                }
            } else {
                if(command.substring(0, 4) === "type") {
                    const content = command.substring(5);
                    if(content === "newline" || content === "new line") {
                        setNewContent({content: newContent.content + "\n", location: newContent.location});
                    } else {
                        setNewContent({content: newContent.content + content, location: newContent.location});
                    }
                } else if(command.substring(0, 7) == "save as" || command.substring(0, 7) == "save us") {
                    setTempName(command.substring(8));
                    setShowConfirmDialog(true);
                } else if(command.substring(0, 4) == "save") {
                    saveFile().then(r => {});
                }
            }
        }
    }, [command]);

    useEffect(() => {
        console.log('showConfirmDialog', showConfirmDialog)
    }, [showConfirmDialog]);
    return (
        <WindowScreen name={"Note"}
                      customName={customName}
                      windowIndex={windowIndex}
                      icon={<FaNoteSticky size={25} className={'text-yellow-500'}/>}
        >
            <div className="h-full w-full">
                {showNotification.show &&
                <div className={`${roboto.className} ${showNotification.type == "error" ? 'bg-red-400' : 'bg-green-600'}
                absolute w-full grid justify-items-center text-center h-fit p-2 rounded-lg opacity-80 text-white text-sm`}>
                    <div className={'flex flex-row space-x-1'}>
                        {showNotification.type == "error" ? <FaCircleXmark size={20}/> : <FaCircleCheck size={20}/>}
                        <p>{showNotification.message}</p>
                    </div>
                </div>
                }
                <textarea
                    value={newContent.content}
                    onChange={(e) => setNewContent({content: e.target.value, location: newContent.location})}
                    className={`text-white input w-full h-full p-2 ${roboto.className}`}/>
                <div className={`flex flex-row space-x-3 absolute bottom-16 left-4 ${montserrat.className}`}>
                    <button
                        onClick={async () => {
                            await saveFile()
                        }}
                        className={`${currentContent.content !== newContent.content ? 'bg-yellow-500' : 'bg-gray-700 cursor-default'} 
                        px-2 py-1 w-fit rounded-md text-yellow-950 flex flex-row space-x-1`}>
                        <FaSave size={20}/><p>Save</p>
                    </button>
                    <button
                        onClick={() => setShowSaveAsDialog(true)}
                        className={`bg-yellow-500 px-2 py-1 w-fit rounded-md text-yellow-950 flex flex-row space-x-1`}>
                        <FaRegSave size={20}/><p>Save As</p>
                    </button>
                    {
                        showSaveAsDialog &&
                        <div className={`${montserrat.className} flex flex-row space-x-1 h-[31px]`}>
                            <input
                                id={'newFileName'}
                                type="text"
                                className={`text-white rounded-lg w-[150px] p-1 px-2 border-2 border-yellow-500`}
                                placeholder={'Save as .txt file'}
                            />
                            <button
                                onClick={async (e) => {
                                    const status = await saveFile((document.getElementById('newFileName') as HTMLInputElement).value + ".txt");
                                    if(status) {
                                        setCustomName((document.getElementById('newFileName') as HTMLInputElement).value + ".txt");
                                        setShowSaveAsDialog(false)
                                    }
                                }
                            }
                                className={'text-sm bg-yellow-500 px-2 text rounded-lg'}>Confirm</button>
                        </div>
                    }
                    {
                        showConfirmDialog &&
                        <div className={'text-sm flex flex-row h-fit space-x-1'}>
                            <div className={'bg-green-400 flex flex-row px-2 py-1 rounded-lg space-x-1'}>
                                <FaCircleInfo size={20}/>
                                <p>New file will be saved as {tempName}.txt</p>
                            </div>
                            <div className={'bg-green-400 flex flex-row px-2 py-1 rounded-lg space-x-1'}>
                                <FaVolumeHigh size={20}/>
                                <p>Confirm/Cancel</p>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </WindowScreen>
    )
}