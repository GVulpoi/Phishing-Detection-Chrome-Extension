import joblib
import pandas as pd
import requests
from bs4 import BeautifulSoup
import re
import urllib.parse
from urllib.parse import urlparse
import socket
import math
from collections import Counter

model = joblib.load('phishing_detector.pkl')


#random string
def shannon_entropy(s):
    if not s:
        return 0
    p, lns = Counter(s), float(len(s))
    return -sum(count / lns * math.log2(count / lns) for count in p.values())

def has_random_string(url, threshold=4.0):
    parsed = urlparse(url)
    path = parsed.path.replace('/', '')
    entropy = shannon_entropy(path)
    return 1 if entropy > threshold else 0


#domeniu in subdomenii
def domain_in_subdomains(url):
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    parts = hostname.split('.')
    if len(parts) < 2:
        return 0
    domain = parts[-2]
    subdomains = parts[:-2]
    return 1 if domain in subdomains else 0

#insecure forms
def detect_insecure_forms(html):
    soup = BeautifulSoup(html, 'html.parser')
    forms = soup.find_all('form')
    for form in forms:
        action = form.get('action', '')
        if action and not action.startswith('https'):
            return 1
    return 0

#formuri relative
def detect_relative_form_action(html):
    soup = BeautifulSoup(html, 'html.parser')
    forms = soup.find_all('form')
    for form in forms:
        action = form.get('action', '')
        if action and not action.startswith('http'):
            return 1
    return 0


#fake link in status bar
def detect_fake_link_in_status_bar(html):
    soup = BeautifulSoup(html, 'html.parser')
    links = soup.find_all('a')
    for link in links:
        if 'onmouseover' in link.attrs and ('window.status' in link['onmouseover'] or 'status=' in link['onmouseover']):
            return 1
    return 0

#images only in form
def detect_images_only_in_form(html):
    soup = BeautifulSoup(html, 'html.parser')
    forms = soup.find_all('form')
    for form in forms:
        inputs = form.find_all('input')
        if inputs and all(inp.get('type') == 'image' for inp in inputs):
            return 1
    return 0

#formular cu redirect catre alt site
def detect_ext_form_action(html, domain):
    soup = BeautifulSoup(html, 'html.parser')
    forms = soup.find_all('form')
    for form in forms:
        action = form.get('action', '')
        if action and domain not in action and action.startswith('http'):
            return 1
    return 0

#formular fara actiune sau cu actiune nula
def detect_abnormal_form_action(html):
    soup = BeautifulSoup(html, 'html.parser')
    forms = soup.find_all('form')
    for form in forms:
        action = form.get('action', None)
        if not action or action.strip() == "":
            return 1
    inputs = soup.find_all('input')
    for input_l in inputs:
        action = input_l.get('formaction', None)
        if not action or action.strip() == "":
            return 1
    buttons = soup.find_all('button')
    for button in buttons:
        is_disabled = button.get('disabled', None)
        if is_disabled:
            return 1
    return 0

#numar de lucruri care vin din url externe
def pct_external_resource_urls(html, domain):
    soup = BeautifulSoup(html, 'html.parser')
    tags = soup.find_all(['script', 'link', 'img'])
    total = len(tags)
    external = 0
    for tag in tags:
        src = tag.get('src') or tag.get('href')
        if src and src.startswith('http') and domain not in src:
            external += 1
    return external / total if total > 0 else 0.0

#procent de <a> care duc in afara domeniului
def pct_external_hyperlinks(html, domain):
    soup = BeautifulSoup(html, 'html.parser')
    links = soup.find_all('a')
    total = len(links)
    external = 0
    for link in links:
        href = link.get('href', '')
        if href.startswith('http') and domain not in href:
            external += 1
    return external / total if total > 0 else 0.0



#extragere de features
def extract_features(url):
    features = {}
    parsed = urllib.parse.urlparse(url)
    hostname = parsed.hostname or ""
    path = parsed.path or ""
    query = parsed.query or ""
    html = requests.get(url).text
    domain = urlparse(url).hostname


    features['NumDots'] = url.count('.')
    features['SubdomainLevel'] = hostname.count('.') if hostname else 0
    features['PathLevel'] = path.count('/')
    features['UrlLength'] = len(url)
    features['NumDash'] = url.count('-')
    features['NumDashInHostname'] = hostname.count('-')
    features['AtSymbol'] = 1 if '@' in url else 0
    features['TildeSymbol'] = 1 if '~' in url else 0
    features['NumUnderscore'] = url.count('_')
    features['NumPercent'] = url.count('%')
    features['NumQueryComponents'] = len(query.split('&')) if query else 0
    features['NumAmpersand'] = query.count('&')
    features['NumHash'] = url.count('#')
    features['NumNumericChars'] = sum(c.isdigit() for c in url)
    features['NoHttps'] = 0 if url.startswith("https") else 1
    features['RandomString'] = has_random_string(url)
    features['IpAddress'] = 1 if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", hostname) else 0
    features['DomainInSubdomains'] = domain_in_subdomains(url)
    features['DomainInPaths'] = 1 if 'http' in path or 'www' in path else 0
    features['HttpsInHostname'] = 1 if 'https' in hostname else 0
    features['HostnameLength'] = len(hostname)
    features['PathLength'] = len(path)
    features['QueryLength'] = len(query)
    features['DoubleSlashInPath'] = 1 if '//' in path else 0
    features['NumSensitiveWords'] = sum(word in url.lower() for word in ['secure', 'account', 'login', 'signin', 'verify', 'bank', 'update'])
    features['PctExtHyperlinks'] = pct_external_hyperlinks(html, domain)
    features['PctExtResourceUrls'] = pct_external_resource_urls(html, domain)
    features['InsecureForms'] = detect_insecure_forms(html)
    features['RelativeFormAction'] =  detect_relative_form_action(html)
    features['ExtFormAction'] = detect_ext_form_action(html, domain)
    features['AbnormalFormAction'] = detect_abnormal_form_action(html)
    features['FakeLinkInStatusBar'] = detect_fake_link_in_status_bar(html)
    features['ImagesOnlyInForm'] = detect_images_only_in_form(html)

    return features

#predictie
def predict_url(url):
    features = extract_features(url)

    df = pd.DataFrame([features])
    prediction = model.predict(df)[0]
    return prediction


if __name__ == "__main__":
    test_url = input("URL : ")
    print(extract_features(test_url))
    result = predict_url(test_url)
    print("Rezultat:", "Phishing" if result == 1 else "Legitim")
