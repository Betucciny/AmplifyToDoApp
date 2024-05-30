import { useEffect, useRef, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { Authenticator } from "@aws-amplify/ui-react";
import { StorageManager, StorageImage } from "@aws-amplify/ui-react-storage";
import { remove } from "aws-amplify/storage";
import "@aws-amplify/ui-react/styles.css";

interface StorageManagerRef {
  clearFiles: () => void;
}

const client = generateClient<Schema>();

const processFile = async ({ file }: { file: File }) => {
  const fileExtension = file.name.split(".").pop();
  return file
    .arrayBuffer()
    .then((filebuffer) => window.crypto.subtle.digest("SHA-1", filebuffer))
    .then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((a) => a.toString(16).padStart(2, "0"))
        .join("");
      return { file, key: `${hashHex}.${fileExtension}` };
    });
};

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [filePath, setFilePath] = useState<string>("");
  const [newTodo, setNewTodo] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  

  function createTodo() {
    if (!newTodo) return;
    if (!filePath) return window.alert("Please upload a file");
    client.models.Todo.create({ content: newTodo, file: filePath });
    setNewTodo("");
    setFilePath("");
    if (ref.current) {
      (ref.current as StorageManagerRef).clearFiles(); // Add type assertion to specify the type of ref.current
    }
  }

  function deleteTodo(todo: Schema["Todo"]["type"]) {
    remove({ path: todo.file! })
      .then(() => client.models.Todo.delete({ id: todo.id }))
      .catch((e) => console.error(e));
  }
  console.log(filePath);
  console.log(newTodo);

  return (
    <Authenticator>
      {({ signOut }) => (
        <main>
          <h1>My todos</h1>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <StorageManager
            acceptedFileTypes={["image/*"]}
            path="public/"
            maxFileCount={1}
            processFile={processFile}
            onFileRemove={() => setFilePath("")}
            ref={ref}
            onUploadSuccess={({ key }: { key?: string | undefined }) => setFilePath(key!)}
          />
          <button onClick={createTodo}>+ add</button>
          <ul>
            {todos.map((todo) => (
              <li key={todo.id} onClick={() => deleteTodo(todo)}>
                {todo.content}
                <StorageImage alt="sleepy-cat" path={`${todo.file}`} />
              </li>
            ))}
          </ul>
          <div>
            🥳 App successfully hosted. Try creating a new todo.
            <br />
          </div>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  );
}

export default App;
