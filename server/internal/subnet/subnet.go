package subnet

import (
	"crypto/sha256"
	"encoding/hex"
	"net"
	"net/http"
	"strings"
)

// ExtractClientIP retrieves the real IP address of the client from HTTP headers or RemoteAddr.
func ExtractClientIP(r *http.Request) string {
	var rawIP string
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		rawIP = strings.TrimSpace(ip)
	} else if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			rawIP = strings.TrimSpace(parts[0])
		}
	} else {
		host, _, err := net.SplitHostPort(r.RemoteAddr)
		if err == nil {
			rawIP = host
		} else {
			rawIP = r.RemoteAddr
		}
	}

	rawIP = strings.TrimPrefix(rawIP, "::ffff:")

	// If loopback or local, resolve the host's actual LAN IP
	if rawIP == "127.0.0.1" || rawIP == "::1" || rawIP == "localhost" || rawIP == "" {
		lanIP := GetPrimaryHostLANIP()
		if lanIP != "" {
			return lanIP
		}
	}

	return rawIP
}

// GetPrimaryHostLANIP returns the server's active LAN IPv4 address (e.g., 192.168.x.x or 10.x.x.x)
func GetPrimaryHostLANIP() string {
	addrs, err := net.InterfaceAddrs()
	if err == nil {
		for _, addr := range addrs {
			if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
				if ip4 := ipnet.IP.To4(); ip4 != nil {
					// Found private IPv4 (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
					return ip4.String()
				}
			}
		}
	}
	return "127.0.0.1"
}

// DeriveSubnetCIDR calculates the /24 CIDR mask.
// If the connecting client is loopback (127.0.0.1 or ::1), it automatically maps to the server's LAN subnet
// so devices connecting via 'localhost' and phones connecting via Wi-Fi join the exact same room!
func DeriveSubnetCIDR(ipStr string) (string, string) {
	ip := net.ParseIP(ipStr)

	// If loopback or nil, automatically associate with the host's actual LAN subnet
	if ip == nil || ip.IsLoopback() || ipStr == "127.0.0.1" || ipStr == "::1" {
		lanIP := GetPrimaryHostLANIP()
		if parsedLan := net.ParseIP(lanIP); parsedLan != nil {
			ip = parsedLan
		}
	}

	var cidr string
	if ip4 := ip.To4(); ip4 != nil {
		// IPv4: /24 subnet mask (255.255.255.0)
		mask := net.CIDRMask(24, 32)
		network := ip4.Mask(mask)
		cidr = network.String() + "/24"
	} else {
		// IPv6: /64 subnet mask
		mask := net.CIDRMask(64, 128)
		network := ip.Mask(mask)
		cidr = network.String() + "/64"
	}

	roomHash := HashString(cidr)
	return cidr, roomHash
}

// HashString returns a 64-char SHA256 hex string
func HashString(input string) string {
	h := sha256.New()
	h.Write([]byte("lan-courier-subnet:" + input))
	return hex.EncodeToString(h.Sum(nil))
}
