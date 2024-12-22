<?php

$name = $_POST['name'];
$email = $_POST['email'];
$subject = $_POST['subject'];
$message = $_POST['message'];

require 'vendor/autoload.php';

$email = new \SendGrid\Mail\Mail(); 
$email->setFrom($email, $name);
$email->setSubject($subject);
$email->addTo("info@plastichem.in");
$email->addContent("text/plain", "$message");

$sendgrid = new \SendGrid(getenv('SENDGRID_API_KEY'));
try {
    $response = $sendgrid->send($email);
    print $response->statusCode() . "\n";
    print_r($response->headers());
    print $response->body() . "\n";
} catch (Exception $e) {
    echo 'Caught exception: '. $e->getMessage() ."\n";
}