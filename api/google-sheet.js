export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const response = await fetch("https://script.google.com/macros/s/AKfycby7RkSsLDqRDnx54Lz7hK5x9SL1CpRl3ScqetOo4UQfCxschsiek-mVm0_PWqAiub7X/exec", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req.body)
            });

            const data = await response.text();
            res.status(200).json({ message: "Success", data: data });

        } catch (error) {
            res.status(500).json({ message: "Error submitting data", error: error.toString() });
        }
    }
    else if (req.method === "GET") {
        try {
            const response = await fetch("https://script.google.com/macros/s/AKfycby7RkSsLDqRDnx54Lz7hK5x9SL1CpRl3ScqetOo4UQfCxschsiek-mVm0_PWqAiub7X/exec", {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            res.status(200).json({ message: "Success", data });

        } catch (error) {
            res.status(500).json({ message: "Error fetching data", error: error.toString() });
        }
    }
    else {
        res.status(405).json({ message: "Method Not Allowed" });
    }
}
