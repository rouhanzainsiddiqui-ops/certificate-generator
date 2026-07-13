import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const generateCertificates = async (
  students: string[],
  templateUrl: string,
  signatureDataUrl: string,
  selectedFont: string,
  layout: {
    name: { x: number, y: number, size: number },
    signature: { x: number, y: number, width: number },
    date: { enabled: boolean, x: number, y: number, size: number, format: string, value: string }
  },
  onProgress: (status: string) => void
) => {
  try {
    onProgress("Cooking certificates... 🍳");
    const zip = new JSZip();
    const folder = zip.folder("Certificates");

    // Load images
    const templateImg = await loadImage(templateUrl);
    const signatureImg = await loadImage(signatureDataUrl);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    canvas.width = templateImg.width;
    canvas.height = templateImg.height;

    for (let i = 0; i < students.length; i++) {
      const student = students[i].trim();
      if (!student) continue;

      onProgress(`Generating for ${student}... (${i+1}/${students.length})`);

      // Draw background
      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

      // Draw Name
      const fontSize = Math.floor(canvas.height * (layout.name.size / 100));
      ctx.font = `bold ${fontSize}px "${selectedFont}", sans-serif`;
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(student, canvas.width * (layout.name.x / 100), canvas.height * (layout.name.y / 100));

      // Draw Signature
      const sigWidth = canvas.width * (layout.signature.width / 100);
      const sigHeight = sigWidth / (1660 / 678);
      
      const sigX = (canvas.width * (layout.signature.x / 100)) - (sigWidth / 2);
      const sigY = (canvas.height * (layout.signature.y / 100)) - (sigHeight / 2);

      ctx.drawImage(signatureImg, sigX, sigY, sigWidth, sigHeight);

      // Draw Date
      if (layout.date.enabled) {
        const dateFontSize = Math.floor(canvas.height * (layout.date.size / 100));
        ctx.font = `${dateFontSize}px "${selectedFont}", sans-serif`;
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        let dateText = layout.date.value || new Date().toLocaleDateString();
        // Just use the value provided
        
        ctx.fillText(dateText, canvas.width * (layout.date.x / 100), canvas.height * (layout.date.y / 100));
      }

      // Get blob
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(b => resolve(b), 'image/jpeg', 0.95);
      });

      if (blob && folder) {
        folder.file(`${student.replace(/[^a-z0-9]/gi, '_')}_Certificate.jpg`, blob);
      }
    }

    onProgress("Zipping files... 📦");
    const content = await zip.generateAsync({ type: "blob" });
    
    onProgress("Done! 🎉 Downloading...");
    saveAs(content, "Certificates_Batch.zip");
    
    setTimeout(() => {
      onProgress("");
    }, 3000);
  } catch (error) {
    console.error(error);
    onProgress("Error generating certificates. ❌");
    setTimeout(() => {
      onProgress("");
    }, 3000);
  }
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};
