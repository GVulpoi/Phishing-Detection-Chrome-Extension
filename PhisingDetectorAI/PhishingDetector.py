import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

df = pd.read_csv("Phishing_Legitimate_full.csv")

X = df.drop(["id", "CLASS_LABEL","EmbeddedBrandName",
             'ExtFavicon', 'PctNullSelfRedirectHyperlinks',
             'FrequentDomainNameMismatch', 'RightClickDisabled', 'PopUpWindow', 'SubmitInfoToEmail',
             'IframeOrFrame','MissingTitle','SubdomainLevelRT', 'UrlLengthRT', 'PctExtResourceUrlsRT',
             'AbnormalExtFormActionR', 'ExtMetaScriptLinkRT', 'PctExtNullSelfRedirectHyperlinksRT'], axis=1)
y = df["CLASS_LABEL"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=48)

model = RandomForestClassifier(n_estimators=60, random_state=48)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("Acuratețe:", accuracy_score(y_test, y_pred))
print("\nMatricea de confuzie: ", confusion_matrix(y_test, y_pred))
print("\nRaport clasificare: \n", classification_report(y_test, y_pred))

joblib.dump(model, 'phishing_detector.pkl')
