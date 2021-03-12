import React from "react"
import "./App.css"

function App() {
  const [url, setUrl] = React.useState("")
  const [shortVersion, setShortVersion] = React.useState("")

  const a = () => {
    const requestOptions: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }
    fetch("https://7hgvo533rc.execute-api.eu-west-2.amazonaws.com/prod", requestOptions)
      .then((response) => response.json())
      .then((data) => setShortVersion(`https://7hgvo533rc.execute-api.eu-west-2.amazonaws.com/prod/${data.id}`))
      .catch((e) => {
        console.error(e)
      })
  }

  return (
    <div className="App">
      {shortVersion && <h1>{shortVersion}</h1>}
      {!shortVersion && (
        <>
          <h1>Minify a URL</h1>
          <label htmlFor="url" />
          <input id="url" onChange={(e) => setUrl(e.target.value)} />
          <button onClick={() => a()}>Make tiny</button>
        </>
      )}
    </div>
  )
}

export default App
