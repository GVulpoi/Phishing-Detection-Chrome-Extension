import pandas as pd
import tensorflow as tf
import tensorflowjs as tfjs
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

df = pd.read_csv("Phishing_Legitimate_full.csv")
X = df.drop(["id", "CLASS_LABEL","EmbeddedBrandName",
             'ExtFavicon', 'PctNullSelfRedirectHyperlinks',
             'FrequentDomainNameMismatch', 'RightClickDisabled', 'PopUpWindow', 'SubmitInfoToEmail',
             'IframeOrFrame','MissingTitle','SubdomainLevelRT', 'UrlLengthRT', 'PctExtResourceUrlsRT',
             'AbnormalExtFormActionR', 'ExtMetaScriptLinkRT', 'PctExtNullSelfRedirectHyperlinksRT'], axis=1)
y = df["CLASS_LABEL"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=48)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

model = tf.keras.models.Sequential([
    tf.keras.layers.Dense(64, activation='relu', input_shape=(X_train.shape[1],)),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=10, batch_size=32, validation_data=(X_test, y_test))

tfjs.converters.save_keras_model(model, "phishing_detector_tfjs")