import Button from "react-bootstrap/Button";

export default function SongsList({songs, onSelect}) {
    return (
        <table className="table">
            <thead>
            <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Action</th>
            </tr>
            </thead>
            <tbody>
            {songs.map(song => (
                <tr key={song.key}>
                    <th>{song.number}</th>
                    <td>{song.title}</td>
                    <td>
                        <Button variant="primary" onClick={() => onSelect(song)}>Select</Button>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    )
}
