document.addEventListener("DOMContentLoaded", function () {
  const cekButton = document.getElementById("cek_button");
  const formSoal = document.getElementById("form_soal");
  const predictionResultElement = document.getElementById("hasil_prediksi");
  const downloadButton = document.getElementById("downloadResultButton");
  const totalQuestions = 22;

  formSoal.style.display = "none";

  document.getElementById("nameSubmitButton").addEventListener("click", function (event) {
    event.preventDefault();
    var name = document.getElementById("name").value;
    var kelas = document.getElementById("class").value;
    var sekolah = document.getElementById("school").value;

    if (name.trim() !== "" && kelas.trim() !== "" && sekolah.trim() !== "") {
      document.getElementById("data").style.display = "none";
      formSoal.style.display = "block";
    }
  });

  cekButton.addEventListener("click", function (event) {
    event.preventDefault();
    handlePrediction();
  });

  function handlePrediction() {
    let totalVisual = 0;
    let totalAudio = 0;
    let totalKinestetik = 0;
    let allAnswered = true;

    for (let i = 1; i <= totalQuestions; i++) {
      const jawaban = document.querySelector(`input[name="jawaban${i}"]:checked`);

      if (jawaban) {
        if (jawaban.value === "a") {
          totalVisual++;
        } else if (jawaban.value === "b") {
          totalAudio++;
        } else if (jawaban.value === "c") {
          totalKinestetik++;
        }
      } else {
        allAnswered = false;
        break;
      }
    }

    if (allAnswered) {
      const counts = {
        visual: totalVisual,
        audio: totalAudio,
        kinestetik: totalKinestetik,
      };

      const values = Object.values(counts);
      const maxCount = Math.max(...values);
      const hasDuplicates = values.filter((value) => value === maxCount).length > 1;

      if (hasDuplicates) {
        if (counts.visual === maxCount && counts.audio === maxCount) {
          document.getElementById("tipe_1").style.display = "block";
        } else if (counts.visual === maxCount && counts.kinestetik === maxCount) {
          document.getElementById("tipe_2").style.display = "block";
        } else if (counts.audio === maxCount && counts.kinestetik === maxCount) {
          document.getElementById("tipe_3").style.display = "block";
        }

        cekButton.innerText = "Deteksi Ulang";
        cekButton.removeEventListener("click", handlePrediction);
        cekButton.addEventListener("click", handleAdditionalPrediction);
        return;
      }

      sendPredictionRequest(totalVisual, totalAudio, totalKinestetik);
    } else {
      alert("Silakan jawab semua soal terlebih dahulu!");
    }
  }

  function handleAdditionalPrediction() {
    let totalVisual = 0;
    let totalAudio = 0;
    let totalKinestetik = 0;

    for (let i = 1; i <= totalQuestions; i++) {
      const jawaban = document.querySelector(`input[name="jawaban${i}"]:checked`);

      if (jawaban) {
        if (jawaban.value === "a") {
          totalVisual++;
        } else if (jawaban.value === "b") {
          totalAudio++;
        } else if (jawaban.value === "c") {
          totalKinestetik++;
        }
      }
    }

    sendPredictionRequest(totalVisual, totalAudio, totalKinestetik);
  }

  function sendPredictionRequest(totalVisual, totalAudio, totalKinestetik) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/deteksi");
    xhr.setRequestHeader("Content-Type", "application/json");

    const postData = JSON.stringify({
      totalVisual: totalVisual,
      totalAudio: totalAudio,
      totalKinestetik: totalKinestetik,
    });

    xhr.onload = function () {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        const predictionLabel = response["kelas_prediksi_label"];
        const additionalParagraph = response["additional_paragraph"];
        const additionalParagraph2 = response["additional_paragraph2"];
        displayPrediction(predictionLabel, additionalParagraph, additionalParagraph2);

        const name = document.getElementById("name").value;
        const kelas = document.getElementById("class").value;
        const sekolah = document.getElementById("school").value;

        downloadButton.style.display = "block";
        downloadButton.addEventListener("click", function () {
          downloadPDF(name, kelas, sekolah, predictionLabel, additionalParagraph, additionalParagraph2);
        });
      } else {
        console.error("Error:", xhr.statusText);
      }
    };

    xhr.onerror = function () {
      console.error("Network Error");
    };

    xhr.send(postData);
  }

  function displayPrediction(predictionLabel, additionalParagraph, additionalParagraph2) {
    predictionResultElement.innerHTML = `
      <h3>Hasil Prediksi</h3>
      <p><strong>${predictionLabel}</strong></p>
      <p>${additionalParagraph}</p>
      <p>${additionalParagraph2}</p>
    `;
    predictionResultElement.style.display = "block";
  }

  function downloadPDF(name, kelas, sekolah, predictionLabel, additionalParagraph, additionalParagraph2) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/download-pdf");
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.responseType = "blob";

    const postData = JSON.stringify({
      name: name,
      kelas: kelas,
      sekolah: sekolah,
      label: predictionLabel,
      para1: additionalParagraph,
      para2: additionalParagraph2,
    });

    xhr.onload = function () {
      if (xhr.status === 200) {
        const blob = new Blob([xhr.response], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        // Menggunakan format nama "Gaya Belajar - [nama pengguna].pdf"
        a.download = `Gaya Belajar - ${name}.pdf`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        console.error("Error:", xhr.statusText);
      }
    };

    xhr.onerror = function () {
      console.error("Network Error");
    };

    xhr.send(postData);
  }
});
