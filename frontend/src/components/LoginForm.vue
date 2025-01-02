<template>
    <div>
      <form @submit.prevent="submitForm">
        <label for="email">Email:</label>
        <input type="email" v-model="email" required />
  
        <label for="password">Password:</label>
        <input type="password" v-model="password" required />
  
        <button type="submit">Login</button>
      </form>
    </div>
  </template>
  
  <script>
  import { login } from "@/services/authService";
  
  export default {
    data() {
      return {
        email: "",
        password: "",
      };
    },
    methods: {
      async submitForm() {
        try {
          await login(this.email, this.password);
          alert("Login successful!");
          this.$router.push("/dashboard");
        } catch (error) {
          alert("Login failed!");
        }
      },
    },
  };
  </script>
  