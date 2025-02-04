package utils

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"net/http"
	"strconv"

	"github.com/grealyve/lutenix/config"
	"github.com/grealyve/lutenix/logger"
)

var (
	ConfigInstance *config.Config
	tr             = &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client = &http.Client{Transport: tr}
)

func SendCustomRequestAcunetix(requestMethod string, endpoint string, body []byte) (*http.Response, error) {
	req, err := http.NewRequest(requestMethod, ConfigInstance.ACUNETIX_IP+":"+strconv.Itoa(ConfigInstance.ACUNETIX_PORT)+endpoint, bytes.NewBuffer(body))
	if err != nil {
		logger.Log.Errorln("Request creation error:", err)
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-Auth", ConfigInstance.ACUNETIX_API_KEY)

	resp, err := client.Do(req)
	if err != nil {
		logger.Log.Errorln("Request error:", err)
		return nil, err
	}

	return resp, nil
}

func SendGETRequestAcunetix(endpoint string) (*http.Response, error) {
	req, err := http.NewRequest("GET", ConfigInstance.ACUNETIX_IP+":"+strconv.Itoa(ConfigInstance.ACUNETIX_PORT)+endpoint, nil)
	if err != nil {
		logger.Log.Errorln("Request creation error:", err)
		return nil, err
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-Auth", ConfigInstance.ACUNETIX_API_KEY)

	resp, err := client.Do(req)
	if err != nil {
		logger.Log.Errorln("Request error:", err)
		return nil, err
	}

	return resp, nil
}

func SendGETRequestZap(endpoint string, apiKey string, scannerURL string, scannerPort int) (*http.Response, error) {
	url := fmt.Sprintf("http://%s:%d%s", scannerURL, scannerPort, endpoint)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		logger.Log.Errorln("Request creation error:", err)
		return nil, err
	}

	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		logger.Log.Errorln("Request error:", err)
		return nil, err
	}

	return resp, nil
}
