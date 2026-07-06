from flask import Flask, request, Response
from flask_cors import CORS
import interception
import io
import mss
import time
from PIL import Image

app = Flask(__name__)
CORS(app)
interception.auto_capture_devices(keyboard=True, mouse=False)

# Pon aquí la contraseña que quieres escribir en tu página web:
MI_CLAVE_SECRETA = "Felipow123" 

@app.route('/ping', methods=['GET', 'OPTIONS'])
def verificar_login():
    if request.args.get('token') != MI_CLAVE_SECRETA:
        return "Denegado", 403
    return "Autorizado", 200

@app.route('/presionar/<tecla>', methods=['GET', 'OPTIONS'])
def presionar_tecla(tecla):
    token_recibido = request.args.get('token')
    
    if token_recibido != MI_CLAVE_SECRETA:
        return "Acceso denegado", 403

    tecla = tecla.lower()
    try:
        interception.press(tecla)
        return f"Tecla {tecla} presionada", 200
    except Exception as e:
        return f"Error: {str(e)}", 400

def generar_video():
    with mss.mss() as sct:
        monitor = sct.monitors[1]  # monitor 1 es el principal
        while True:
            # Capturamos la pantalla
            sct_img = sct.grab(monitor)
            img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
            
            # Reducimos la resolución a 800x600 aprox para un streaming fluido
            img.thumbnail((800, 600))
            
            # Guardamos la imagen en formato JPEG en memoria
            img_io = io.BytesIO()
            img.save(img_io, 'JPEG', quality=50) # Calidad al 50%
            frame = img_io.getvalue()
            
            # Generamos el formato multipart
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            
            # Esperamos 0.1s para unos 10 fps
            time.sleep(0.1)

@app.route('/stream_pantalla', methods=['GET'])
def stream_pantalla():
    token_recibido = request.args.get('token')
    
    if token_recibido != MI_CLAVE_SECRETA:
        return "Acceso denegado", 403
    
    return Response(generar_video(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
