import React, {useEffect, useState} from "react";
import { onValue, ref, set, remove, query, orderByChild, startAt} from "firebase/database";
import {Editor, EditorState} from 'draft-js';
import SongsList from "./SongsList";
import Button from "react-bootstrap/Button";

const MODE_NEW = "NEW";
const MODE_UPDATE = "UPDATE";

const chords = `span.chunk { position: relative; display: inline-flex; flex-direction: column; vertical-align: bottom; } span.chunk:before { font-size: 0.6em; content: attr(data-chord); position: relative; vertical-align: bottom;`;
const previewStyles = `div {margin: 30px 20px; text-align: center; white-space: pre-wrap;} ${chords}`;

export default function Dashboard(params) {
    const [songs, setSongs] = useState([]);

    const [currentKey, setCurrentKey] = useState(null);
    const [mode, setMode] = useState(null);
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [userText, setUserText] = useState("");

    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        const songsRef = ref(params.db, 'songs');
        onValue(songsRef, (snapshot) => {
            const fetchedSongs = [];
            snapshot.forEach(s => {
                fetchedSongs.push({...s.val(), key: s.key});
            });
            setSongs(fetchedSongs);
        });
    }, []);

    useEffect(() => {
        let textToSet = "";
        if (userText) {
            textToSet = userText.getCurrentContent().getPlainText().replace(/{.*?{!}/g, a => {
                return `<span class="chunk" data-chord="${a.match(/{([^!]*?(?=}))/)[1]}">${a.match(/}(.*?(?={!}))/)[1]}</span>`
            })
        }
        setText(textToSet);
    }, [userText]);

    function setCurrentSong(song){
        setMode(MODE_UPDATE);
        setCurrentKey(song.key);
        setTitle(song.title);

        const text = song.text.replace(/<span class="chunk".*?<\/span>/g, function(a){
            return `{${a.match(/data-chord="(.*?(?="))/)[1]}}${a.match(/<span class="chunk".*>(.*?(?=<))/)[1]}{!}`;
        });

        setUserText(EditorState.createWithText(text));
    }

    function setCreateMode() {
        setMode(MODE_NEW);
        setTitle("");
        setUserText(EditorState.createWithText(""));
        setCurrentKey(null);
    }

    function updateSong() {
        if(currentKey) {
            const errors = validateForm();
            setValidationErrors(errors);
            if(Object.keys(errors).length > 0) {
                return;
            }

            const song = {...songs.find(s => s && s.key === currentKey)};

            populateSong(song);

            set(ref(params.db, 'songs/' + currentKey), song)
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

            const nextNumber = (songs.length > 0 ? Math.max(...songs.filter(s => s.number).map(s => s.number)) : 0) + 1;
            const song = {
                number: nextNumber
            };
            populateSong(song);

            const nextKey = (songs.length > 0 ? Math.max(...songs.filter(s => s.key).map(s => s.key)) : 0) + 1;
            set(ref(params.db, 'songs/' + nextKey), song)
                .then(() => {
                    alert("Created");
                    setMode(MODE_UPDATE);
                    setCurrentKey(nextKey);
                });
        }
    }

    function populateSong(song) {
        song.title = title;
        song.text = text;
        song.updated = Date.now()
    }

    function validateForm() {
        const errors = {};

        if (!title) {
            errors.title = true;
        }

        if(!text) {
            errors.text = true;
        }

        return errors;
    }

    function deleteSong(key) {
        if(window.confirm("Are you sure want to delete Song?")) {
            const song = {...songs.find(s => s.key === key)};
            remove(ref(params.db, 'songs/' + key))
                .then(() => {
                    alert("deleted!");
                    setCurrentKey(null);
                    setTitle("");
                    setUserText("");

                    const songsRef = ref(params.db, 'songs');
                    const mostViewedPosts = query(songsRef, orderByChild('number'), startAt(song.number+1));

                    let songsToUpdate = [];
                    onValue(mostViewedPosts, (snapshot) => {
                        snapshot.forEach((snapshot) => {
                            songsToUpdate.push({key: snapshot.key, val: snapshot.val()});
                        });
                    });

                    songsToUpdate.forEach((s) => {
                        const val = s.val;
                        val.number = val.number - 1;
                        val.updated = Date.now();

                        set(ref(params.db, 'songs/' + s.key), val);
                    });
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
                    {(mode === MODE_NEW || (mode === MODE_UPDATE && currentKey)) && (
                        <div className="card">
                            <h5 className="card-header">
                                {mode === MODE_NEW ? 'Create Song' : 'Update Song '+title}
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
                                        <Editor editorState={userText}
                                                onChange={setUserText}
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
                                        <Button variant="primary" className="me-2" onClick={() => updateSong(currentKey)}>Update</Button>
                                        <Button variant="danger" onClick={() => deleteSong(currentKey)}>Delete</Button>
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
                    {(mode === MODE_NEW || (mode === MODE_UPDATE && currentKey)) && <iframe className="w-100 h-100" srcDoc={`<style>${previewStyles}</style><div>${text}</div>`}/>}
                </div>
            </div>
        </div>
    )
}
