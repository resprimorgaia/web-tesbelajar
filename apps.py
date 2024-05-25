from flask import Flask, render_template, request, jsonify, send_file
from joblib import load
from fpdf import FPDF
import io

app = Flask(__name__)
model = load('model/modelsaya.model')

@app.route("/")
def beranda():
    return render_template('index.html')

@app.route('/api/deteksi', methods=['POST'])
def predict():
    data = request.get_json()

    total_visual = data.get('totalVisual', 0)
    total_audio = data.get('totalAudio', 0)
    total_kinestetik = data.get('totalKinestetik', 0)

    try:
        total_visual = int(total_visual)
        total_audio = int(total_audio)
        total_kinestetik = int(total_kinestetik)
    except ValueError:
        return jsonify({'error': 'Invalid input'}), 400

    prediction = model.predict([[total_visual, total_audio, total_kinestetik]])

    if prediction[0] == 0:
        prediction_label = "Gaya Belajar Auditori"
        additional_paragraph = "Anda adalah tipe orang yang suka mendengarkan dan berbicara untuk belajar. Anda merasa lebih mudah memahami informasi yang disampaikan secara lisan, seperti melalui ceramah atau diskusi kelompok. Anda lebih cepat menangkap pelajaran ketika mendengarkan rekaman audio atau menjelaskan kembali materi kepada orang lain. Suara dan ritme sangat berpengaruh dalam proses belajar Anda, sehingga Anda mungkin suka belajar sambil mendengarkan musik yang menenangkan."
        additional_paragraph2 = "Untuk meningkatkan efektivitas belajar, Anda dapat menggunakan metode pembelajaran berbasis audio seperti mendengarkan podcast edukatif atau rekaman ceramah. Menggunakan model pembelajaran berbasis diskusi dan tanya jawab juga akan sangat membantu. Merekam diri Anda sendiri saat membaca materi atau berbicara tentang topik tertentu kemudian mendengarkannya kembali bisa menjadi cara yang efektif untuk memperkuat pemahaman dan ingatan Anda."
    elif prediction[0] == 1:
        prediction_label = "Gaya Belajar Kinestetik"
        additional_paragraph = "Anda adalah tipe orang yang suka bergerak dan melakukan aktivitas fisik untuk belajar. Anda merasa lebih mudah memahami informasi melalui pengalaman langsung dan praktek. Saat belajar, Anda mungkin cenderung untuk mencatat dengan tangan, membuat model tiga dimensi, atau melakukan eksperimen. Anda lebih suka belajar dengan melibatkan tubuh dan indera Anda, sehingga Anda sering merasa bosan dengan pembelajaran yang hanya bersifat teoritis dan statis."
        additional_paragraph2 = "Untuk meningkatkan efektivitas belajar, Anda bisa menggunakan metode pembelajaran berbasis aktivitas fisik seperti eksperimen atau simulasi. Menggunakan model pembelajaran berbasis proyek atau permainan edukatif juga akan sangat bermanfaat. Menggabungkan gerakan tubuh dengan proses belajar, seperti berjalan-jalan sambil menghafal atau membuat model fisik dari konsep yang dipelajari, dapat membantu Anda lebih memahami dan mengingat materi dengan baik."
    else:
        prediction_label = "Gaya Belajar Visual"
        additional_paragraph = "Anda adalah tipe orang yang suka melihat dan mengamati untuk belajar. Anda merasa lebih mudah memahami informasi melalui gambar, grafik, dan diagram. Saat membaca buku atau materi pembelajaran, Anda cenderung memperhatikan ilustrasi atau tabel yang ada untuk membantu memahami konsep yang disajikan. Anda juga lebih mudah mengingat wajah daripada nama dan lebih suka menggunakan warna-warni dalam catatan untuk mempertegas poin-poin penting."
        additional_paragraph2 = "Untuk meningkatkan efektivitas belajar, Anda dapat menggunakan metode mind mapping dan visualisasi. Membuat catatan dengan gambar, simbol, dan warna akan membantu memperkuat ingatan Anda. Selain itu, menggunakan model pembelajaran berbasis presentasi visual seperti slide PowerPoint atau video edukatif dapat membantu Anda lebih mudah memahami dan mengingat materi yang dipelajari."

    response = {'kelas_prediksi_label': prediction_label, 'additional_paragraph' : additional_paragraph, 'additional_paragraph2' : additional_paragraph2}
    return jsonify(response)

@app.route('/api/download-pdf', methods=['POST'])
def download_pdf():
    data = request.get_json()
    name = data.get('name')
    kelas = data.get('kelas')
    sekolah = data.get('sekolah')
    label = data.get('label')
    para1 = data.get('para1')
    para2 = data.get('para2')

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    pdf.cell(200, 10, txt="Hasil Prediksi", ln=True, align='C')
    pdf.cell(200, 10, txt=f"Nama: {name}", ln=True)
    pdf.cell(200, 10, txt=f"Kelas: {kelas}", ln=True)
    pdf.cell(200, 10, txt=f"Sekolah: {sekolah}", ln=True)
    pdf.ln(10)
    pdf.cell(200, 10, txt=label, ln=True)
    pdf.multi_cell(0, 10, para1)
    pdf.ln(5)
    pdf.multi_cell(0, 10, para2)

    pdf_output = pdf.output(dest='S').encode('latin1')

    pdf_output_io = io.BytesIO(pdf_output)

    # Menggunakan format nama "Gaya Belajar - [nama pengguna].pdf"
    filename = f"Gaya Belajar - {name}.pdf"

    return send_file(pdf_output_io, download_name=filename, as_attachment=True)