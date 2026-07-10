export async function editCommand() {
  console.log("Aegis Edit");

  const request =
    process.argv
      .slice(3)
      .join(" ");

  if (!request) {
    console.log(
      "Usage: aegis edit <request>",
    );

    return;
  }

  console.log(
    `Editing project: ${request}`,
  );
}
