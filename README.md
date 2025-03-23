# MediConnect2
# 🏥 Patient-Clinician Portal for Connected Care and Healthy Aging  

This project is built for **Hackenza 2025**, addressing the **Patient-Clinician Portal for Connected Care and Healthy Aging** problem statement.  

We've developed an application with **elderly patients' accessibility in mind**, providing **AI-generated medical answers** to registered patients. These answers are then **verified by clinicians** to ensure accuracy.  

---

## ⚡ Setup and Run Instructions  
Vercel Link: https://mediconnect-mu.vercel.app/
### Prerequisites  
Ensure you have the following installed before proceeding:  
- **Node.js** (LTS recommended)  
- **pnpm** (Package manager, install it via `npm install -g pnpm` if not already installed)  

### 🛠️ Installation  

1. **Clone the repository**  
   ```sh
   git clone https://github.com/your-username/your-repository.git
   cd your-repository
   ```

2. **Install dependencies**  
   ```sh
   pnpm install
   ```

3. **Run the development server**  
   ```sh
   pnpm run dev
   ```

4. **Open the application**  
   Open [http://localhost:3000](http://localhost:3000) in your browser.  

### ❗ Troubleshooting  
If you encounter an error resembling a caching issue, try clearing the cache with this command:  
```sh
rmdir /s /q .next
```
Then, restart the server.

---

## 🏗️ Framework and Logic  

This project is implemented using:  
- **Next.js** – for an interactive and accessible frontend.  
- **Firebase/Firestore** – as a database to store patient data, clinician records, medical queries, answers, and their verification status.  
- **OpenAI API** – to power the chatbot, providing AI-generated medical responses.  

---

## 🎯 Addressing the Problem  

To mitigate the risk of inaccuracies in AI-generated responses, we've implemented a **clinician verification system**:  
- **Vetted clinicians** can **view, edit, and approve** AI responses.  
- Approval/disapproval is **reflected on the patient dashboard** to ensure trust and transparency.  

---

## 🏆 Accessibility Considerations  

Given our **elderly user base**, we have designed the platform to be:  
✅ **Clean and easy to navigate**  
✅ **Speech-to-text enabled** (limited to Chrome for now due to security constraints in Brave)  

---

## 🔥 Additional Features  

- **Feedback System**: Patients can indicate whether they found a response helpful.  
- **Future Implementation**: A rating system for clinicians based on feedback, enhancing answer quality and verification reliability.  

---

👨‍⚕️ **Built with care for a healthier future!** 🚀

