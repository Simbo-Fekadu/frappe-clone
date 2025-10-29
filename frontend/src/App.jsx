import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ContactForm from "./components/ContactForm";
import ContactsList from "./components/ContactsList";
import CompaniesList from "./components/CompaniesList";
import DealsList from "./components/DealsList";
import Layout from "./components/Layout";
import LeadsList from "./components/LeadsList";
import PipelineDashboard from "./components/PipelineDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/deals" replace />} />
          <Route path="deals" element={<DealsList />} />
          <Route path="leads" element={<LeadsList />} />
          <Route
            path="contacts"
            element={
              <>
                <div style={{ padding: 12 }}>
                  <h2 style={{ marginTop: 0 }}>Contacts</h2>
                  <ContactForm />
                  <div style={{ height: 12 }} />
                  <ContactsList />
                </div>
              </>
            }
          />
          <Route
            path="companies"
            element={
              <>
                <div style={{ padding: 12 }}>
                  <h2 style={{ marginTop: 0 }}>Companies</h2>
                  <CompaniesList />
                </div>
              </>
            }
          />
          <Route path="dashboard" element={<PipelineDashboard />} />
          <Route path="*" element={<Navigate to="/deals" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
