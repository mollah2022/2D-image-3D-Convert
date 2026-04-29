import os
import shutil
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from gradio_client import Client, handle_file

app = FastAPI()

# Enable CORS so your Vite app can talk to this server
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

# YOUR SETTINGS
HF_TOKEN = "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"
client = Client("microsoft/TRELLIS", token=HF_TOKEN)

@app.post("/convert")
async def convert_image(image: UploadFile = File(...)):
    temp_path = f"temp_{image.filename}"
    with open(temp_path, "wb") as f:
        f.write(await image.read())

    try:
        # Initialize the session state for TRELLIS before converting
        client.predict(api_name="/start_session")
        
        # Calling TRELLIS .predict() for /image_to_3d
        client.predict(
            image=handle_file(temp_path),
            multiimages=[],
            seed=0,
            ss_guidance_strength=7.5,
            ss_sampling_steps=12,
            slat_guidance_strength=3.0,
            slat_sampling_steps=12,
            multiimage_algo="stochastic",
            api_name="/image_to_3d"
        )
        
        # Now extract the .glb file
        glb_result = client.predict(
            mesh_simplify=0.95,
            texture_size=1024,
            api_name="/extract_glb"
        )
        
        # Move the .glb file to our static folder
        generated_file_path = glb_result[1] if isinstance(glb_result, (list, tuple)) else glb_result
        output_filename = "demo_model.glb"
        shutil.move(generated_file_path, f"static/{output_filename}")
        
        return {"model_url": f"http://localhost:8000/static/{output_filename}"}

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
