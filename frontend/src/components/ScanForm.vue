<template>
    <div>
      <h3>Start a New Scan</h3>
      <form @submit.prevent="submitForm">
        <label for="scanner">Select Scanner:</label>
        <select v-model="scanner" required>
          <option value="acunetix">Acunetix</option>
          <option value="semgrep">Semgrep</option>
          <option value="zap">OWASP ZAP</option>
        </select>
  
        <label for="targetURL">Target URL:</label>
        <input type="text" v-model="targetURL" required />
  
        <label for="apiKey">API Key:</label>
        <input type="text" v-model="apiKey" required />
  
        <button type="submit">Start Scan</button>
      </form>
    </div>
  </template>
  
  <script>
  import { startScan } from "@/services/scanService";
  
  export default {
    data() {
      return {
        scanner: "acunetix",
        targetURL: "",
        apiKey: "",
      };
    },
    methods: {
      async submitForm() {
        try {
          const response = await startScan(this.scanner, this.targetURL, this.apiKey);
          alert(response.message);
        } catch (error) {
          alert("Error starting scan");
        }
      },
    },
  };
  </script>
  