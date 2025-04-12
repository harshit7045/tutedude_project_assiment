import react from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import LoginWithGoogleButton from "../components/login";

export default function Loginpage() {
    return (
        <>
            <Header />
            <LoginWithGoogleButton />
            <Footer />
        </>
    )
}