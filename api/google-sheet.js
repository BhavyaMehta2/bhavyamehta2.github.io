export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const response = await fetch("https://script.google.com/macros/s/AKfycbwKhlPU_XUOCbxXd24bfzpugllpTA5qy3FAUaa_PHmyiQNcA6niQL4uDgBEmv3TtQ-2/exec", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req.body)
            });

            const data = await response.text();
            res.status(200).json({ message: "Success", data: data });

        } catch (error) {
            res.status(500).json({ message: "Error submitting data", error: error.toString() });
        }
    } else {
        res.status(405).json({ message: "Method Not Allowed" });
    }
}
