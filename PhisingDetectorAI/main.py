import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from urllib.parse import urlparse


def extract_features(url):
    features = {}
    parsed_url = urlparse(url)
    features['url_length'] = len(url)
    features['num_dots'] = url.count('.')
    features['num_hyphens'] = url.count('-')
    features['num_slashes'] = url.count('/')
    features['num_digits'] = sum(c.isdigit() for c in url)
    features['num_subdomains'] = parsed_url.netloc.count('.')
    features['https'] = 1 if parsed_url.scheme == 'https' else 0
    features['num_queries'] = len(parsed_url.query)
    return features

def load_dataset():
    data = pd.read_csv('train_data.csv')
    a = data['url'].apply(lambda x: pd.Series(extract_features(x), print(x)))
    b = data['status']
    return a, b

characteristics, labels = load_dataset()
X_train, X_test, y_train, y_test = train_test_split(characteristics, labels, test_size=0.2, random_state=42)
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)
y_pred = clf.predict(X_test)
print("Train Accuracy:", accuracy_score(y_test, y_pred))

def load_dataset_test():
    data = pd.read_csv('test_data.csv')
    a = data['url'].apply(lambda x: pd.Series(extract_features(x), print(x)))
    b = data['type']
    return a, b

def test(model=clf):
    x, y = load_dataset_test()
    a = 0
    f = 0

    for url, clas in zip(x, y):
        features = pd.Series(extract_features(url))
        prediction = model.predict(features)

        if (clas == "legitimate" and prediction == 0) or (clas == "phising" and prediction == 1):
            a += 1
        else:
            f += 1

    print("Test Accuracy", a / (a + f))


test()