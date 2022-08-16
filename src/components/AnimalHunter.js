import { useState, useEffect, useRef } from "react"
import axios from "axios"

import animalsList from '../animals.json'

import '../styles/animal-hunter.css'

const AnimalHunter = () => {
  const [imageURL, setImageURL] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [animal, setAnimal] = useState('')
  const [predictionPercent, setPredictionPercent] = useState(0)
  const [animalImages, setAnimalImages] = useState([])

  const googleApiBearer = process.env.REACT_APP_GOOGLE_API_BEARER

  const canvasRef = useRef(null)

  const resetStates = () => {
    setImageURL(null)
    setImageBase64(null)
    setAnimal('')
    setPredictionPercent(0)
    setAnimalImages([])
  }

  function toDataURL(src, callback) {
    var img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = function() {
      var canvas = document.createElement('CANVAS')
      var context = canvas.getContext('2d')
      var dataURL
      canvas.height = this.naturalHeight
      canvas.width = this.naturalWidth
      context.drawImage(this, 0, 0)
      dataURL = canvas.toDataURL()
      callback(dataURL)
    }
    img.src = src
    if (img.complete || img.complete === undefined) {
      img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
      img.src = src
    }
  }

  const handleUploadChange = ({ target }) => {
    resetStates()
    const imgUrl = URL.createObjectURL(target.files[0])
    setImageURL(imgUrl)
    toDataURL(
      imgUrl,
      (dataUrl) => setImageBase64(dataUrl.split("base64,")[1])
    )    
  }

  useEffect(() => {
    if (imageBase64) {
      axios.post(
        'https://automl.googleapis.com/v1beta1/projects/526176804522/locations/us-central1/models/ICN7225622081348567040:predict',
        {
          "payload": {
            "image": {
              "imageBytes": imageBase64
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': 'Bearer $(gcloud auth application-default print-access-token)'
            'Authorization': `Bearer ${googleApiBearer}`
          }
        }
      )
      .then(res => {
        const { classification, displayName: animalName } = res.data.payload[0]
        setAnimal(animalName)
        setPredictionPercent(Math.round(classification.score * 100))
      })
      .catch((error) => {
        const {
          code,
          message
        } = error.response.data.error
        console.log(`CODE ${code} | ${message}`)
      })
    }
  }, [imageBase64])

  useEffect(() => {
    if (animal) {
      const animalFilter = animalsList.filter(a => a.name === animal)
      setAnimalImages(animalFilter[0].images)
    }
  }, [animal])
  
  
  const drawImageOnCanvas = (image, canvas, context) => {
    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight
    canvas.width = image.width
    canvas.height = image.height

    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    const isLandscape = naturalWidth > naturalHeight
    context.drawImage(
      image,
      isLandscape ? (naturalWidth - naturalHeight) / 2 : 0,
      isLandscape ? 0 : (naturalHeight - naturalWidth) / 2,
      isLandscape ? naturalHeight : naturalWidth,
      isLandscape ? naturalHeight : naturalWidth,
      0,
      0,
      context.canvas.width,
      context.canvas.height
    )
  }

  const onImageChange = async ({ target }) => {
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    drawImageOnCanvas(target, canvas, context)
  }

  const AnimalPreview = () => (
    <div id="animal-preview">
      <canvas id="new-img" ref={canvasRef}>
        <img alt="preview" onLoad={onImageChange} src={imageURL} />
      </canvas>
    </div>
  )

  return (
    <div id="image-finder" >
      <h1>Animal Hunter</h1>
      <h2>Upload a photo of an animal to see more images of that animal!</h2>
      <input
        type="file"
        onChange={handleUploadChange}
        accept="image/x-png,image/jpeg"
      />
      {imageURL && <AnimalPreview />}
      {(animal && predictionPercent) && <div id="animal-info" >
        <h3>There is a {predictionPercent}% chance that the animal you are searching for is {['a','e','i','o','u'].includes(animal.charAt(0)) ? 'an' : 'a'} <span id="animal-name">{animal}</span>.</h3>
          <h2>More photos:</h2>
        <div id="animal-photos">
          {animalImages.map((animalImage, i) => {
            return <img className="animal-photo" key={i} alt={`${animal} photo`} src={animalImage} />
          })}
        </div> 
      </div>}
    </div>
  )
}

export default AnimalHunter