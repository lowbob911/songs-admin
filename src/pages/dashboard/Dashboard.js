import React, {useEffect, useState} from "react";
import { onValue, ref, set, remove} from "firebase/database";
import {Editor, EditorState} from 'draft-js';
import SongsList from "./SongsList";
import Button from "react-bootstrap/Button";

const MODE_NEW = "NEW";
const MODE_UPDATE = "UPDATE";

export default function Dashboard(params) {
    const [songs, setSongs] = useState([]);

    const [currentNumber, setCurrentNumber] = useState(null);
    const [mode, setMode] = useState(null);
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");

    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        const songsRef = ref(params.db, 'songs');
        onValue(songsRef, (snapshot) => {
            setSongs(snapshot.val().filter(s => s));
        });
    }, []);

    function setCurrentSong(song){
        setMode(MODE_UPDATE);
        setCurrentNumber(song.number);
        setTitle(song.title);
        setText(EditorState.createWithText(song?.text || ""));
    }

    function setCreateMode() {
        setMode(MODE_NEW);
        setTitle("");
        setText(EditorState.createWithText(""));
        setCurrentNumber(null);
    }

    function updateSong() {
        if(currentNumber) {
            const errors = validateForm();
            setValidationErrors(errors);
            if(Object.keys(errors).length > 0) {
                return;
            }

            const song = {...songs.find(s => s && s.number === currentNumber)};

            populateSong(song);

            set(ref(params.db, 'songs/' + currentNumber), song)
                .then(() => {
                    alert("Updated")
                });
        }
    }

    function createSong() {
        if(mode === MODE_NEW) {
            const errors = validateForm();
            setValidationErrors(errors);
            if(Object.keys(errors).length > 0) {
                return;
            }

            const nextNumber = (songs.length > 0 ? Math.max(...songs.map(s => s.number)) : 0) + 1;

            const song = {
                number: nextNumber
            };
            populateSong(song);

            set(ref(params.db, 'songs/' + nextNumber), song)
                .then(() => {
                    alert("Created");
                    setMode(MODE_UPDATE);
                    setCurrentNumber(nextNumber);
                });
        }
    }

    function populateSong(song) {
        song.title = title;
        song.text = text.getCurrentContent().getPlainText();
        song.updated = Date.now()
    }

    function validateForm() {
        const errors = {};

        if (!title) {
            errors.title = true;
        }

        if(!text.getCurrentContent().getPlainText()) {
            errors.text = true;
        }

        return errors;
    }

    function deleteSong(number) {
        if(window.confirm("Are you sure want to delete Song?")) {
            remove(ref(params.db, 'songs/' + number))
                .then(() => {
                    alert("deleted!");
                    setCurrentNumber(null);
                    setTitle("");
                    setText("");
                })
        }
    }

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12 col-lg-4">
                    <div className="card">
                        <h5 className="card-header">
                            Songs List
                            <Button className="float-end" variant="success" onClick={setCreateMode}>Create</Button>
                        </h5>
                        <div className="card-body">
                            <SongsList
                                songs={songs}
                                onSelect={setCurrentSong}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    {(mode === MODE_NEW || (mode === MODE_UPDATE && currentNumber)) && (
                        <div className="card">
                            <h5 className="card-header">
                                {mode === MODE_NEW ? 'Create Song' : 'Update Song '+currentNumber}
                            </h5>
                            <div className="card-body">
                                <div>
                                    <label htmlFor="titleInput" className="form-label">Title:</label>
                                    <input type="text" className={`form-control ${validationErrors.title && 'is-invalid'}`} id="titleInput"
                                           placeholder="Song Title" value={title}
                                           onChange={(event) => setTitle(event.target.value)}/>
                                    <div id="validationServer05Feedback" className="invalid-feedback">
                                        Should not be empty
                                    </div>
                                </div>
                                <div>
                                    Text:
                                    <div className={`${validationErrors.text && 'is-invalid'}`}>
                                        <Editor editorState={text}
                                                onChange={setText}
                                                className={"test"}
                                        />
                                    </div>
                                    <div id="validationServer05Feedback" className="invalid-feedback">
                                        Should not be empty
                                    </div>
                                </div>
                                <div className="mt-1 text-center">
                                    {mode === MODE_UPDATE &&
                                    <>
                                        <Button variant="primary" className="me-2" onClick={() => updateSong(currentNumber)}>Update</Button>
                                        <Button variant="danger" onClick={() => deleteSong(currentNumber)}>Delete</Button>
                                    </>
                                    }
                                    {mode === MODE_NEW &&
                                    <>
                                        <Button variant="primary" onClick={() => createSong()}>Create</Button>
                                    </>
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="col-12 col-lg-4">
                    {(mode === MODE_NEW || (mode === MODE_UPDATE && currentNumber)) && <iframe className="w-100 h-100" srcDoc={`<div style="text-align: center; white-space: pre-wrap">${text.getCurrentContent().getPlainText()}</div>`}/>}
                </div>
            </div>
        </div>
    )
}
